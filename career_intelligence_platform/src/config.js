// Central place for frontend configuration values.
// API base URL is read from environment so we can easily switch
// between localhost and production (Vercel + backend host).
// In development, empty string uses relative URLs so package.json "proxy" forwards to backend.

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'development'
      ? ''
      : 'http://localhost:5000';

