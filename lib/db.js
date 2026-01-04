import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

function getCaCert() {
  // Prefer env var (Vercel). Fall back to local file (dev).
  if (process.env.DB_CA_CERT && process.env.DB_CA_CERT.trim()) {
    return process.env.DB_CA_CERT;
  }

  const caCertPath = path.join(__dirname, '..', 'ca-certificate.crt');
  return fs.readFileSync(caCertPath, 'utf8');
}

export function getPool() {
  if (!pool) {
    const caCert = getCaCert();

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 25060,
      user: process.env.DB_USER_PUBLIC,
      password: process.env.DB_PASSWORD_PUBLIC,
      database: process.env.DB_NAME,
      ssl: { ca: caCert, rejectUnauthorized: true },
      connectionLimit: 10,
    });
  }
  return pool;
}
