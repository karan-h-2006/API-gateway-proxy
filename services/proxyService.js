const env = require('../config/env');
const AppError = require('./appError');

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'accept-encoding',
  'content-encoding'
]);

const buildUpstreamUrl = (req) => {
  const baseUrl = new URL(env.UPSTREAM_BASE_URL);
  const proxyPathValue = Array.isArray(req.params.proxyPath)
    ? req.params.proxyPath.join('/')
    : req.params.proxyPath;
  const proxyPath = proxyPathValue ? `/${proxyPathValue}` : '';
  const normalizedBasePath = baseUrl.pathname.endsWith('/')
    ? baseUrl.pathname.slice(0, -1)
    : baseUrl.pathname;

  baseUrl.pathname = `${normalizedBasePath}${proxyPath}` || '/';
  baseUrl.search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  return baseUrl.toString();
};

const buildForwardHeaders = (req) => {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === env.API_KEY_HEADER_NAME.toLowerCase()) {
      return;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
      return;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    }
  });

  return headers;
};

const buildRequestBody = (req) => {
  if (req.method === 'GET' || req.method === 'DELETE') {
    return undefined;
  }

  if (!req.body || req.body.length === 0) {
    return undefined;
  }

  return req.body;
};

const filterResponseHeaders = (headers) => {
  const filteredHeaders = {};

  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      filteredHeaders[key] = value;
    }
  });

  return filteredHeaders;
};

const forwardRequest = async (req) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.PROXY_TIMEOUT_MS);

  try {
    const response = await fetch(buildUpstreamUrl(req), {
      method: req.method,
      headers: buildForwardHeaders(req),
      body: buildRequestBody(req),
      signal: controller.signal
    });

    const responseBody = Buffer.from(await response.arrayBuffer());

    return {
      status: response.status,
      headers: filterResponseHeaders(response.headers),
      body: responseBody
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError(504, 'Upstream request timed out.');
    }

    throw new AppError(502, 'Failed to reach the upstream service.');
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  forwardRequest
};
