// api/admin/team/[id]/photo.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAdminPool } from '../../../../lib/admindb.js';

/**
 * Helper: slug from name
 */
function slugFromName(name, idFallback) {
  if (!name) return `member-${idFallback}`;

  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → dash
      .replace(/^-+|-+$/g, '') || `member-${idFallback}`
  );
}

/**
 * Build Spaces S3 client (throws if env vars missing).
 * Keeping this inside handler prevents module-load crashes that can trigger
 * your dev runner to restart and show the Windows "taskkill PID not found" noise.
 */
function buildS3ClientFromEnv() {
  const { SPACES_REGION, SPACES_ENDPOINT, SPACES_KEY, SPACES_SECRET } = process.env;

  if (!SPACES_REGION || !SPACES_ENDPOINT || !SPACES_KEY || !SPACES_SECRET) {
    throw new Error(
      'Missing Spaces env vars. Required: SPACES_REGION, SPACES_ENDPOINT, SPACES_KEY, SPACES_SECRET.'
    );
  }

  return new S3Client({
    region: SPACES_REGION,
    endpoint: SPACES_ENDPOINT,
    credentials: {
      accessKeyId: SPACES_KEY,
      secretAccessKey: SPACES_SECRET,
    },
  });
}

/**
 * Extract object key from a public URL.
 * Prefers SPACES_ORIGIN_URL prefix, but includes a safe fallback.
 */
function extractKeyFromPublicUrl(imageUrl, publicBase) {
  if (!imageUrl) return null;

  const base = String(publicBase || '').replace(/\/+$/, '');
  const url = String(imageUrl);

  if (base && url.startsWith(base + '/')) {
    return url.slice(base.length + 1);
  }

  // Fallback: strip protocol+host, keep path (no leading slash)
  // e.g. https://bucket.nyc3.cdn.digitaloceanspaces.com/team/x.png -> team/x.png
  const m = url.match(/^https?:\/\/[^/]+\/(.+)$/i);
  return m?.[1] || null;
}

export default async function handler(req, res) {
  const { id } = req.query;
  const method = req.method;

  const bucket = process.env.SPACES_BUCKET;
  const publicBase = process.env.SPACES_ORIGIN_URL;

  if (!id) {
    res.status(400).json({ error: 'Missing team member id.' });
    return;
  }

  if (!bucket || !publicBase) {
    res
      .status(500)
      .json({ error: 'Server misconfigured. Missing SPACES_BUCKET or SPACES_ORIGIN_URL.' });
    return;
  }

  // Initialize inside handler so any init errors return JSON (instead of crashing dev runner)
  let adminPool;
  let s3;

  try {
    adminPool = getAdminPool();
    s3 = buildS3ClientFromEnv();
  } catch (err) {
    console.error('[ADMIN] Init error in /api/admin/team/[id]/photo:', err);
    res.status(500).json({ error: 'Server misconfigured (init failed). Check env vars.' });
    return;
  }

  if (method === 'POST') {
    try {
      const { imageData } = req.body || {};
      if (!imageData || typeof imageData !== 'string') {
        res.status(400).json({ error: 'Missing imageData.' });
        return;
      }

      const match = imageData.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ error: 'Invalid image data URL.' });
        return;
      }

      const mimeType = match[1];
      const base64 = match[2];
      const buffer = Buffer.from(base64, 'base64');

      // Look up member name for a stable slug
      const [rows] = await adminPool.query('SELECT name FROM team_members WHERE id = ?', [id]);
      const memberName = rows[0]?.name || '';
      const baseSlug = slugFromName(memberName, id);

      let ext = 'jpg';
      if (mimeType === 'image/png') ext = 'png';
      else if (mimeType === 'image/webp') ext = 'webp';
      else if (mimeType === 'image/gif') ext = 'gif';

      const key = `team/${baseSlug}-profile-picture.${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        })
      );

      const publicUrl = `${String(publicBase).replace(/\/+$/, '')}/${key}`;

      await adminPool.query('UPDATE team_members SET image_url = ? WHERE id = ?', [
        publicUrl,
        id,
      ]);

      res.status(200).json({ image_url: publicUrl });
    } catch (err) {
      console.error('[ADMIN] Error in /api/admin/team/[id]/photo POST:', err);
      res.status(500).json({ error: 'Failed to upload photo.' });
    }
    return;
  }

  if (method === 'DELETE') {
    try {
      const [rows] = await adminPool.query('SELECT image_url FROM team_members WHERE id = ?', [id]);
      const imageUrl = rows[0]?.image_url;

      if (imageUrl) {
        const key = extractKeyFromPublicUrl(imageUrl, publicBase);

        if (key) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: key,
            })
          );
        } else {
          console.warn('[ADMIN] Could not extract key from image_url:', imageUrl);
        }
      }

      await adminPool.query('UPDATE team_members SET image_url = NULL WHERE id = ?', [id]);

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[ADMIN] Error in /api/admin/team/[id]/photo DELETE:', err);
      res.status(500).json({ error: 'Failed to delete photo.' });
    }
    return;
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}
