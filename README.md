# API Gateway Proxy

A student-friendly backend portfolio project that acts as a lightweight API gateway/proxy.

It supports:
- developer registration and login
- JWT-protected API key management
- API key authentication on proxied traffic
- rate limiting per API key
- request forwarding to an upstream API
- asynchronous request analytics logging

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ

## Architecture

This project stays as a single backend application and keeps a simple layered structure:

- `routes` for HTTP endpoints
- `controllers` for request/response handling
- `services` for business logic
- `db/repositories` for Prisma queries

## Features

### 1. Developer authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Developers register with `name`, `email`, and `password`. Passwords are hashed with `bcrypt`. After registration/login, the server returns a JWT for protected dashboard routes.

### 2. API key management

- `POST /api/v1/api-keys`
- `GET /api/v1/api-keys`
- `POST /api/v1/api-keys/:id/regenerate`
- `PATCH /api/v1/api-keys/:id/revoke`

Raw API keys are only returned once. The database stores only a SHA-256 hash and a visible prefix.

### 3. Proxy traffic

- `GET /proxy/*`
- `POST /proxy/*`
- `PUT /proxy/*`
- `PATCH /proxy/*`
- `DELETE /proxy/*`

The gateway expects the API key in the `x-api-key` header by default. If the key is valid and within the rate limit, the request is forwarded to `UPSTREAM_BASE_URL`.

### 4. Rate limiting

Rate limiting is applied per API key using Redis when Redis is available.

Default policy:
- `10` requests
- per `60` seconds

Rate limit headers are returned on proxy responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

If Redis is unavailable, the app falls back to an in-memory limiter so the project can still run locally for demo purposes.

### 5. Analytics

Every authenticated proxy request is logged with:
- HTTP method
- gateway path
- upstream path
- status code
- latency
- timestamp
- whether the request was rate limited

Analytics are written asynchronously:
- BullMQ + Redis when Redis is available
- direct background persistence fallback when Redis is unavailable

Analytics endpoints:
- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/requests?limit=25`

### 6. Health check

- `GET /health`

Returns database status plus the current Redis/rate-limiter/analytics mode.

## Database Models

### `Developer`

- `id`
- `email`
- `name`
- `passwordHash`
- `isActive`
- `createdAt`
- `updatedAt`

### `ApiKey`

- `id`
- `developerId`
- `name`
- `keyPrefix`
- `keyHash`
- `lastUsedAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

### `RequestLog`

- `id`
- `developerId`
- `apiKeyId`
- `method`
- `gatewayPath`
- `upstreamPath`
- `statusCode`
- `latencyMs`
- `wasRateLimited`
- `requestedAt`

## Environment Variables

Use `.env.example` as the reference.

Important variables:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/apigateway?schema=public
JWT_SECRET=change-this-secret-to-a-long-random-value
JWT_EXPIRES_IN=1d

API_KEY_HEADER_NAME=x-api-key
UPSTREAM_BASE_URL=https://jsonplaceholder.typicode.com
PROXY_TIMEOUT_MS=10000

REDIS_URL=redis://127.0.0.1:6379/0
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_SECONDS=60
ANALYTICS_QUEUE_NAME=request-analytics
ANALYTICS_WORKER_CONCURRENCY=5
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create/update your `.env`

Use the values from `.env.example`.

### 3. Make sure PostgreSQL is running

Create a database named `apigateway` or update `DATABASE_URL` to match your database.

### 4. Sync Prisma schema

```bash
npm run prisma:push
```

### 5. Optional but recommended: start Redis

If Redis is running, the app will use:
- Redis-backed rate limiting
- BullMQ analytics jobs

If Redis is not running, the project still works in fallback mode for local demos.

### 6. Start the server

```bash
npm run dev
```

or

```bash
npm start
```

## Postman Test Flow

### 1. Register

`POST /api/v1/auth/register`

```json
{
  "name": "Student Dev",
  "email": "student@example.com",
  "password": "Password123"
}
```

### 2. Login

`POST /api/v1/auth/login`

Use the returned JWT in:

```text
Authorization: Bearer <token>
```

### 3. Create an API key

`POST /api/v1/api-keys`

```json
{
  "name": "My First Key"
}
```

Save the returned raw API key. It is shown only once.

### 4. Proxy a request

Example:

`GET /proxy/posts/1`

Header:

```text
x-api-key: <raw-api-key>
```

### 5. Check analytics

- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/requests?limit=10`

## Example Route Summary

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### API keys

- `POST /api/v1/api-keys`
- `GET /api/v1/api-keys`
- `POST /api/v1/api-keys/:id/regenerate`
- `PATCH /api/v1/api-keys/:id/revoke`

### Analytics

- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/requests`

### Gateway

- `ALL /proxy/*`

### Health

- `GET /health`

## Error Handling

The app returns consistent JSON errors for:

- `400` validation errors
- `401` invalid or missing JWT/API key
- `403` inactive accounts
- `404` missing resources
- `409` duplicate developer email
- `429` rate limit exceeded
- `502` upstream failure
- `504` upstream timeout

## Notes

- Redis is the intended store for rate limiting.
- BullMQ is the intended async queue for analytics.
- To keep this project easy to run for internships and demos, there is a fallback mode when Redis is unavailable.
- This is a monolith by design to keep the project understandable and interview-friendly.
