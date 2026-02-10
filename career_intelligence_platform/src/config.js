// Central place for frontend configuration values.
// In development, empty string uses package.json "proxy" to backend.
// In production (e.g. Vercel): set REACT_APP_API_BASE_URL to your backend URL
// (e.g. https://career-intelligence-platform-backen.vercel.app) so upload/auth/etc work.

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL !== undefined && process.env.REACT_APP_API_BASE_URL !== ''
    ? process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '')
    : process.env.NODE_ENV === 'development'
      ? ''
      : '';

