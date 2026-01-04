// lib/admindb.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminPool;

function getCaCert() {
  // Prefer env var (best for Vercel / serverless). Fall back to local file (dev).
  const fromEnv = process.env.DB_CA_CERT;
  if (fromEnv && String(fromEnv).trim()) {
    return fromEnv;
  }

  const caCertPath = path.join(__dirname, '..', 'ca-certificate.crt');
  return fs.readFileSync(caCertPath, 'utf8');
}

export function getAdminPool() {
  if (!adminPool) {
    const caCert = getCaCert();

    adminPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 25060,
      user: process.env.DB_USER_ADMIN, // solar_admin_app
      password: process.env.DB_PASSWORD_ADMIN,
      database: process.env.DB_NAME,
      ssl: {
        ca: caCert,
        rejectUnauthorized: true,
      },
      connectionLimit: 5,
    });
  }

  return adminPool;
}
