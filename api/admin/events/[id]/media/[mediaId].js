// api/admin/events/[id]/media/[mediaId].js
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAdminPool } from '../../../../../lib/admindb.js'; // ✅ 5x ../ (correct)

function buildS3() {
  return new S3Client({
    region: process.env.SPACES_REGION,
    endpoint: process.env.SPACES_ENDPOINT,
    credentials: {
      accessKeyId: process.env.SPACES_KEY,
      secretAccessKey: process.env.SPACES_SECRET,
    },
  });
}

function keyFromAnyUrl(url) {
  if (!url) return null;
  const m = String(url).match(/^https?:\/\/[^/]+\/(.+)$/i);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]); // turn %20 into real spaces
  } catch {
    return m[1];
  }
}

export default async function handler(req, res) {
  const { id: eventId, mediaId } = req.query;

  try {
    const method = req.method;

    if (method !== 'DELETE' && method !== 'PATCH') {
      res.setHeader('Allow', ['DELETE', 'PATCH']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const pool = getAdminPool();

    if (method === 'PATCH') {
      const { caption } = req.body || {};
      const cleanCaption = typeof caption === 'string' ? (caption.trim() || null) : null;

      const [result] = await pool.query(
        `UPDATE media_assets
            SET caption = ?
          WHERE id = ? AND event_id = ?`,
        [cleanCaption, mediaId, eventId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Media not found.' });
      }

      return res.status(200).json({ ok: true, caption: cleanCaption });
    }

    // === DELETE ===
    const bucket = process.env.SPACES_BUCKET;
    const publicBase = process.env.SPACES_ORIGIN_URL;

    if (!bucket) return res.status(500).json({ error: 'Missing SPACES_BUCKET.' });
    if (!publicBase) return res.status(500).json({ error: 'Missing SPACES_ORIGIN_URL.' });

    const [rows] = await pool.query(
      `SELECT id, event_id, url, object_key
         FROM media_assets
        WHERE id = ? AND event_id = ?`,
      [mediaId, eventId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Media not found.' });
    }

    const row = rows[0];

    // Prefer object_key; fallback to deriving from url
    const rawKey = row.object_key || keyFromAnyUrl(row.url);

    // Normalize in case object_key accidentally stored with %20
    const keyToDelete = rawKey ? decodeURIComponent(String(rawKey)) : null;

    // Delete from Spaces (best effort)
    if (keyToDelete) {
      const s3 = buildS3();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: keyToDelete,
        })
      );
    }

    // Delete DB row
    await pool.query(
      `DELETE FROM media_assets
        WHERE id = ? AND event_id = ?`,
      [mediaId, eventId]
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/events/[id]/media/[mediaId]:', err);
    return res.status(500).json({
      error: 'Failed to delete media.',
      details: err?.message || String(err),
    });
  }
}
