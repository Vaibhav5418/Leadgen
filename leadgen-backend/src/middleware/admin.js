/**
 * Admin Authorization Middleware
 * Ensures the authenticated user has administrative privileges.
 */
const requireAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const isAdmin = 
      user.role === 'admin' || 
      user.isAdmin === true || 
      user.email === 'akshay@kology.co';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrator privileges are required to perform this action.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization verification failed'
    });
  }
};

/**
 * Role-Based Access Control Middleware Generator
 * @param {string[]} allowedRoles Array of allowed roles (e.g. ['admin', 'manager'])
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Root admin / admin boolean always gets access
      if (user.isAdmin === true || user.email === 'akshay@kology.co') {
        return next();
      }

      const userRole = (user.role || 'employee').toLowerCase();
      const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization verification failed'
      });
    }
  };
};

module.exports = {
  requireAdmin,
  requireRole
};
