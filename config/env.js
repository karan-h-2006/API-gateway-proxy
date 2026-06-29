const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const buildDatabaseUrl = (env) => {
  const user = encodeURIComponent(env.PGUSER || 'postgres');
  const password = encodeURIComponent(env.PGPASSWORD || 'password');
  const host = env.PGHOST || 'localhost';
  const port = env.PGPORT || '5432';
  const database = env.PGDATABASE || 'apigateway';

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
};

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildDatabaseUrl(process.env);
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  PGHOST: z.string().default('localhost'),
  PGPORT: z.coerce.number().int().positive().default(5432),
  PGDATABASE: z.string().default('apigateway'),
  PGUSER: z.string().default('postgres'),
  PGPASSWORD: z.string().default('password'),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long.'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  API_KEY_SIZE: z.coerce.number().int().min(16).default(32),
  API_KEY_ENCODING: z.enum(['hex', 'base64url']).default('hex'),
  API_KEY_HEADER_NAME: z.string().default('x-api-key'),
  PROXY_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  UPSTREAM_BASE_URL: z.url().default('https://jsonplaceholder.typicode.com')
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('Invalid environment variables');
  console.error(env.error.format());
  process.exit(1);
}

module.exports = env.data;
