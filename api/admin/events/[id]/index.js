// pages/api/admin/events/[id]/index.js
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAdminPool } from '../../../../lib/admindb.js';

function normalizeRequiredString(v, { max = 100 } = {}) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeOptionalString(v) {
  if (v === '' || v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function buildS3() {
  const { SPACES_REGION, SPACES_ENDPOINT, SPACES_KEY, SPACES_SECRET } = process.env;
  if (!SPACES_REGION || !SPACES_ENDPOINT || !SPACES_KEY || !SPACES_SECRET) {
    throw new Error('Missing Spaces env vars (REGION/ENDPOINT/KEY/SECRET).');
  }
  return new S3Client({
    region: SPACES_REGION,
    endpoint: SPACES_ENDPOINT,
    credentials: { accessKeyId: SPACES_KEY, secretAccessKey: SPACES_SECRET },
  });
}

function keyFromAnyUrl(url) {
  if (!url) return null;
  const m = String(url).match(/^https?:\/\/[^/]+\/(.+)$/i);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export default async function handler(req, res) {
  const { id } = req.query;
  const pool = getAdminPool();

  try {
    // --------------------
    // GET: fetch event
    // --------------------
    if (req.method === 'GET') {
      const [rows] = await pool.query(`SELECT * FROM solar_events WHERE id = ?`, [id]);
      if (!rows.length) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json(rows[0]);
    }

    // --------------------
    // PUT: update event
    // --------------------
    if (req.method === 'PUT') {
      const body = req.body || {};

      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const event_date = body.event_date ? String(body.event_date).slice(0, 10) : '';
      const event_type = normalizeRequiredString(body.event_type, { max: 100 });

      const location = normalizeOptionalString(body.location);
      const short_description = normalizeOptionalString(body.short_description);
      const impact_on_communication = normalizeOptionalString(body.impact_on_communication);
      const summary = typeof body.summary === 'string' ? body.summary.trim() : '';

      if (!title) return res.status(400).json({ error: 'title is required' });
      if (!event_date) return res.status(400).json({ error: 'event_date is required (YYYY-MM-DD)' });
      if (!event_type) return res.status(400).json({ error: 'event_type is required' });
      if (!summary) return res.status(400).json({ error: 'summary is required' });

      const [result] = await pool.query(
        `UPDATE solar_events
            SET title = ?,
                event_date = ?,
                event_type = ?,
                location = ?,
                short_description = ?,
                summary = ?,
                impact_on_communication = ?
          WHERE id = ?`,
        [title, event_date, event_type, location, short_description, summary, impact_on_communication, id]
      );

      if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });

      const [rows] = await pool.query(`SELECT * FROM solar_events WHERE id = ?`, [id]);
      return res.status(200).json(rows[0]);
    }

    // --------------------
    // DELETE: delete event + (optionally) media in Spaces
    // --------------------
    if (req.method === 'DELETE') {
      // 1) Load media rows (so we know object_key/url)
      const [mediaRows] = await pool.query(
        `SELECT id, url, object_key
           FROM media_assets
          WHERE event_id = ?`,
        [id]
      );

      // 2) Delete DB event row
      // Because your FK is ON DELETE CASCADE, this will auto-delete media_assets rows.
      const [delEvent] = await pool.query(`DELETE FROM solar_events WHERE id = ?`, [id]);

      if (delEvent.affectedRows === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // 3) OPTIONAL: delete objects from DigitalOcean Spaces (best effort)
      // You can skip this if you only care about DB deletion.
      const bucket = process.env.SPACES_BUCKET;
      if (bucket) {
        try {
          const s3 = buildS3();
          for (const m of mediaRows) {
            const rawKey = m.object_key || keyFromAnyUrl(m.url);
            if (!rawKey) continue;

            const key = decodeURIComponent(String(rawKey));
            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          }
        } catch (e) {
          // Best-effort cleanup only: don't fail the request because object deletion failed
          console.warn('[ADMIN] Spaces cleanup failed (best-effort):', e?.message || e);
        }
      }

      return res.status(200).json({
        ok: true,
        deletedMediaCount: mediaRows.length,
      });
    }

    // --------------------
    // Otherwise: 405
    // --------------------
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[ADMIN] /api/admin/events/[id] error:', err);
    return res.status(500).json({
      error: 'Request failed.',
      details: err?.message || String(err),
    });
  }
}
