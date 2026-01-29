const jwt = require('jsonwebtoken');

/**
 * Express middleware to protect routes using JWT Bearer tokens.
 * Expects header: Authorization: Bearer <token>
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  const [scheme, token] = authHeader.split(' ');

  if (!token || scheme !== 'Bearer') {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change_me_in_production';
    const decoded = jwt.verify(token, secret);

    // Attach decoded user payload to request for downstream handlers
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    };

    return next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

