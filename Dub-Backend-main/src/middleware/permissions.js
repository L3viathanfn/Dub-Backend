const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }
        
        if (!req.user.roles.isAdmin) {
            return res.status(403).json({
                error: 'Permission denied',
                message: 'You do not have administrator privileges'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Permission check failed',
            message: error.message
        });
    }
};

const requireEliteDonator = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        if (!req.user.roles.isEliteDonator) {
            return res.status(403).json({
                error: 'Elite Donator status required',
                message: 'This feature is only available to Elite Donators'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Permission check failed',
            message: error.message
        });
    }
};

const requireFullLocker = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        if (!req.user.roles.hasFullLocker) {
            return res.status(403).json({
                error: 'Full Locker status required',
                message: 'This feature is only available to Full Locker members'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Permission check failed',
            message: error.message
        });
    }
};

const requireBooster = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        if (!req.user.roles.isBooster) {
            return res.status(403).json({
                error: 'Booster status required',
                message: 'This feature is only available to Server Boosters'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Permission check failed',
            message: error.message
        });
    }
};

module.exports = {
    requireAdmin,
    requireEliteDonator,
    requireFullLocker,
    requireBooster
};