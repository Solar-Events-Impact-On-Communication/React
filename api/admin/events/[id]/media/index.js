// api/admin/events/[id]/media/index.js

import formidable from 'formidable';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import { getAdminPool } from '../../../../../lib/admindb.js';

export const config = {
  api: { bodyParser: false }, // required for formidable
};

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

function stripTrailingSlashes(s) {
  return String(s || '').replace(/\/+$/, '');
}

function randHex(n = 8) {
  return Math.random().toString(16).slice(2, 2 + n);
}

function isoSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

function safeDateFolder(dateVal) {
  if (!dateVal) return 'unknown-date';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return 'unknown-date';
  return d.toISOString().slice(0, 10);
}

function pickFirstFile(f) {
  if (!f) return null;
  return Array.isArray(f) ? f[0] : f;
}

export default async function handler(req, res) {
  const { id: eventId } = req.query;

  try {
    const pool = getAdminPool();

    if (req.method === 'GET') {
      const [rows] = await pool.query(
        `SELECT id, event_id, url, caption, object_key
           FROM media_assets
          WHERE event_id = ?
          ORDER BY id ASC`,
        [eventId]
      );
      return res.status(200).json(rows);
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const bucket = process.env.SPACES_BUCKET;
    const publicBase = process.env.SPACES_ORIGIN_URL;
    if (!bucket) return res.status(500).json({ error: 'Missing SPACES_BUCKET.' });
    if (!publicBase) return res.status(500).json({ error: 'Missing SPACES_ORIGIN_URL.' });

    // Get event date for folder name
    const [evRows] = await pool.query(`SELECT event_date FROM solar_events WHERE id = ?`, [eventId]);
    const yyyyMmDd = safeDateFolder(evRows?.[0]?.event_date);

    // Parse multipart form
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
    });

    const caption =
      typeof fields.caption === 'string'
        ? (fields.caption.trim() || null)
        : Array.isArray(fields.caption)
          ? (String(fields.caption[0] || '').trim() || null)
          : null;

    // Expect file input name="file"
    const uploaded = pickFirstFile(files?.file);
    if (!uploaded) {
      return res.status(400).json({ error: 'No file uploaded. Use form-data field "file".' });
    }

    // formidable v2/v3 commonly uses filepath; older uses path
    const filepath = uploaded.filepath || uploaded.path;
    if (!filepath) {
      return res.status(400).json({
        error: 'Upload received but no filepath found (formidable file object missing filepath/path).',
        debug: {
          keys: Object.keys(uploaded || {}),
          originalFilename: uploaded?.originalFilename,
          mimetype: uploaded?.mimetype,
        },
      });
    }

    const mimeType = uploaded.mimetype || uploaded.type || 'image/jpeg';
    const ext = extFromMime(mimeType);

    // Unique name prevents overwrites
    const objectKey = `articles/event-${eventId}-${yyyyMmDd}/${isoSafe()}_${randHex()}.${ext}`;
    const url = `${stripTrailingSlashes(publicBase)}/${encodeURI(objectKey)}`;

    // Duplicate guard
    const [dup] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM media_assets WHERE event_id = ? AND object_key = ?`,
      [eventId, objectKey]
    );
    if (dup?.[0]?.cnt > 0) {
      return res.status(409).json({ error: 'This upload already exists for this event.' });
    }

    const s3 = buildS3();

    // Read the temp file created by formidable
    const buf = await fs.readFile(filepath);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey, // IMPORTANT: use raw key
        Body: buf,
        ContentType: mimeType,
        ACL: 'public-read',
      })
    );

    // Optional cleanup (don’t fail upload if delete fails)
    try {
      await fs.unlink(filepath);
    } catch (_) {}

    const [result] = await pool.query(
      `INSERT INTO media_assets (event_id, url, caption, object_key)
       VALUES (?, ?, ?, ?)`,
      [eventId, url, caption, objectKey]
    );

    const [created] = await pool.query(
      `SELECT id, event_id, url, caption, object_key
         FROM media_assets
        WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(created[0]);
  } catch (err) {
    console.error('[ADMIN] media index error:', err);
    return res.status(500).json({ error: 'Failed to upload media.', details: err?.message || String(err) });
  }
}
