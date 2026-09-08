const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT and extract user data
 * @param {string|string[]} [roles] Optional role or array of roles allowed to access the route
 */
const authorize = (roles = []) => {
    // Convert single role to array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        try {
            // Get token from header (support both Authorization Bearer and legacy x-auth-token)
            const authHeader = req.header('Authorization');
            const token = authHeader?.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : req.header('x-auth-token');

            if (!token) {
                return res.status(401).json({ msg: 'No token, authorization denied' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // The decoded token will have at least id and role from the new unified users table
            req.user = decoded;

            // Check roles if specified
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ msg: 'Forbidden: Insufficient privileges' });
            }

            next();
        } catch (err) {
            console.error('Auth middleware error:', err.message);
            res.status(401).json({ msg: 'Token is not valid' });
        }
    };
};

module.exports = authorize;
