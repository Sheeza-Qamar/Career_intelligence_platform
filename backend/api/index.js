/**
 * Vercel serverless entry: export Express app.
 * All routes are handled by the app (see vercel.json routes).
 */
const app = require('../src/app');
module.exports = app;
