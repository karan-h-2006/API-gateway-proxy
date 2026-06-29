const { z } = require('zod')
const dotenv = require('dotenv')

dotenv.config()

const envSchema = z.object({
  //NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000), // Convert string to integer
  //HOST: z.string().default('localhost'),
  PGHOST: z.string().default('localhost'),
  PGPORT: z.coerce.number().default(5432), // By default it will be string, so we need to convert it to integer.
  PGDATABASE: z.string().default('api_gateway'),
  PGUSER: z.string().default('postgres'),
  PGPASSWORD: z.string().default('password'),
  API_KEY_SIZE: z.coerce.number().default(32), // Convert string to number
  API_KEY_ENCODING: z.string().default('hex')
})

const env = envSchema.safeParse(process.env)

if (!env.success) {
  console.log('Invalid environment variables')
  console.log(env.error.format())
  process.exit(1)
}

module.exports = env.data