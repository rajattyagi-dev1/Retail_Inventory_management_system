/**
 * Centralized API Client for Retail Inventory Management System (Project ID: P_022).
 * Wraps browser fetch with base URL configuration, parameter serialization, and error handling.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

class ApiClientError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Builds a query string from a parameters object, discarding undefined, null, or empty string values.
 * @param {object} params 
 * @returns {string}
 */
function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Performs an HTTP request against the API backend.
 * @param {string} endpoint - API path relative to BASE_URL (e.g. '/products')
 * @param {object} options - Fetch options including method, body, params, headers
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const { params, headers = {}, body, ...customConfig } = options;

  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}${buildQueryString(params)}`;

  const config = {
    method: customConfig.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (body !== undefined && body !== null) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Parse response body if present
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
      throw new ApiClientError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    // Network or parsing errors
    throw new ApiClientError(
      error.message || 'Unable to connect to the backend server. Please check your network connection.',
      0,
      null
    );
  }
}

export const api = {
  get: (endpoint, params, options = {}) => request(endpoint, { ...options, method: 'GET', params }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiClientError };
export default api;
