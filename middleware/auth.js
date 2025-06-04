import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
     console.log('authMiddleware called');
    // Example: check token, set req.user
    // Log req.user to check
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Role-based access control
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
      }

      req.user = decoded;
          console.log('req.user:', req.user);


      next();

    } catch (err) {
      console.error('JWT verification failed:', err.message);

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please log in again.' });
      }

      return res.status(403).json({ message: 'Invalid token' });
    }
  };
};

export const requireDispatchRole = (req, res, next) => {
  if (req.user?.role !== "dispatch") {
    return res.status(403).json({ message: "Access denied. Dispatch only." });
  }
  next();
};


export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    const dbUser = await User.findById(user.id);
    req.user = dbUser; // Save user data for later use
    next();
  });
};

export const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
export const isAccounts = (req, res, next) => {
  if (req.user && (req.user.role === "accounts" || req.user.role === "admin")) {
    return next();
  } else {
    return res.status(403).json({ message: "Access denied. Accounts only." });
  }
};

