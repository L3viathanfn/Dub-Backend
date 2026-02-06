const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Profile = require('../models/Profile');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, config.jwt.secret);
        
        const profile = await Profile.findOne({ discordId: decoded.discordId });
        
        if (!profile) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'User not found'
            });
        }
        
        if (profile.banned.status) {
            return res.status(403).json({
                error: 'Account banned',
                message: `Your account has been banned. Reason: ${profile.banned.reason}`,
                bannedAt: profile.banned.bannedAt,
                bannedBy: profile.banned.bannedBy
            });
        }
        
        req.user = profile;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired, please login again'
            });
        }
        
        res.status(500).json({
            error: 'Authentication error',
            message: error.message
        });
    }
};

module.exports = authMiddleware;