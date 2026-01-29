// Central place for frontend configuration values.
// API base URL is read from environment so we can easily switch
// between localhost and production (Vercel + backend host).

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

