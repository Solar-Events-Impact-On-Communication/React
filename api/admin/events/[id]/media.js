// /api/admin/events/[id]/media.js
import { getAdminPool } from '../../../../../lib/admindb.js';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ✅ Next.js: disable built-in body parser so formidable can read multipart/form-data
export const config = {
  api: { bodyParser: false },
};

function getS3Client() {
  // DigitalOcean Spaces uses an S3-compatible endpoint
  const endpoint = process.env.DO_SPACES_ENDPOINT; // e.g. "https://nyc3.digitaloceanspaces.com"
  const region = process.env.DO_SPACES_REGION || 'us-east-1';

  if (!endpoint || !process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) {
    throw new Error(
      'Missing DO Spaces env vars. Required: DO_SPACES_ENDPOINT, DO_SPACES_KEY, DO_SPACES_SECRET'
    );
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: false,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
  });
}

function getPublicBaseUrl() {
  // Prefer a CDN base if you have one; fallback to direct Spaces URL pattern
  // Examples:
  // DO_SPACES_CDN_BASE="https://newspaper-articles.nyc3.cdn.digitaloceanspaces.com"
  // DO_SPACES_PUBLIC_BASE="https://nyc3.digitaloceanspaces.com/<bucket>"
  if (process.env.DO_SPACES_CDN_BASE) return process.env.DO_SPACES_CDN_BASE.replace(/\/$/, '');
  if (process.env.DO_SPACES_PUBLIC_BASE) return process.env.DO_SPACES_PUBLIC_BASE.replace(/\/$/, '');
  return null;
}

function safeTrim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parseMultipart(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB (you can lower if you want)
    filter: (part) => {
      // Only allow image uploads for the "file" field
      if (part.name !== 'file') return true;
      return !!part.mimetype && part.mimetype.startsWith('image/');
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const pool = getAdminPool();

  try {
    if (method === 'GET') {
      const [rows] = await pool.query(
        `SELECT
           id,
           event_id,
           url,
           caption
         FROM media_assets
         WHERE event_id = ?
         ORDER BY id ASC`,
        [id]
      );
      res.status(200).json(rows);
      return;
    }

    if (method === 'POST') {
      const contentType = req.headers['content-type'] || '';

      // =========================
      // (A) Multipart upload path
      // =========================
      if (contentType.includes('multipart/form-data')) {
        const { fields, files } = await parseMultipart(req);

        const caption = safeTrim(fields?.caption);
        const file = files?.file;

        if (!file) {
          res.status(400).json({ error: 'File is required.' });
          return;
        }

        // formidable v2/v3 differences:
        const filePath = file.filepath || file.path;
        const originalName = file.originalFilename || file.name || 'upload';
        const mimeType = file.mimetype || file.type || 'application/octet-stream';

        // Generate a unique object key
        const ext = path.extname(originalName) || '.jpg';
        const objectKey = `event-media/${id}/${crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex')}${ext}`;

        const bucket = process.env.DO_SPACES_BUCKET;
        if (!bucket) {
          res.status(500).json({ error: 'Missing DO_SPACES_BUCKET env var.' });
          return;
        }

        const s3 = getS3Client();

        const fileBuffer = fs.readFileSync(filePath);

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: objectKey,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read',
          })
        );

        // Build public URL
        const base = getPublicBaseUrl();
        let publicUrl;

        if (base) {
          publicUrl = `${base}/${objectKey}`;
        } else {
          // fallback: endpoint + bucket + key
          // endpoint like: https://nyc3.digitaloceanspaces.com
          const endpoint = process.env.DO_SPACES_ENDPOINT.replace(/\/$/, '');
          publicUrl = `${endpoint}/${bucket}/${objectKey}`;
        }

        // Insert DB row
        const [result] = await pool.query(
          `INSERT INTO media_assets (event_id, url, caption)
           VALUES (?, ?, ?)`,
          [id, publicUrl, caption || null]
        );

        const [rows] = await pool.query(
          `SELECT id, event_id, url, caption
             FROM media_assets
            WHERE id = ?`,
          [result.insertId]
        );

        res.status(201).json(rows[0]);
        return;
      }

      // =========================
      // (B) JSON url fallback path
      // =========================
      // NOTE: This supports your older “paste URL” logic (if you still use it anywhere).
      const body = req.body || {};
      const url = safeTrim(body.url);
      const caption = safeTrim(body.caption);

      if (!url) {
        res.status(400).json({ error: 'URL is required.' });
        return;
      }

      const [result] = await pool.query(
        `INSERT INTO media_assets (event_id, url, caption)
         VALUES (?, ?, ?)`,
        [id, url, caption || null]
      );

      const [rows] = await pool.query(
        `SELECT id, event_id, url, caption
           FROM media_assets
          WHERE id = ?`,
        [result.insertId]
      );

      res.status(201).json(rows[0]);
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[ADMIN] /api/admin/events/[id]/media error:', err);
    res.status(500).json({
      error: 'Media request failed.',
      details: err?.message || String(err),
    });
  }
}
