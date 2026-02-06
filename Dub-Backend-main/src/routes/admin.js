const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/permissions');
const { validateBan, validateVbucksAmount } = require('../middleware/validation');
const Profile = require('../models/Profile');
const Transaction = require('../models/Transaction');
const Shop = require('../models/Shop');
const Cosmetic = require('../models/Cosmetic');
const config = require('../config/config');

router.use(authMiddleware);
router.use(requireAdmin);

router.post('/ban', validateBan, async (req, res) => {
    try {
        const { userId, reason } = req.body;
        
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        if (profile.banned.status) {
            return res.status(400).json({
                error: 'User is already banned'
            });
        }
        
        profile.banned = {
            status: true,
            reason: reason,
            bannedBy: req.user.username,
            bannedAt: new Date()
        };
        
        await profile.save();
        
        res.json({
            message: 'User banned successfully',
            user: {
                discordId: profile.discordId,
                username: profile.username,
                bannedBy: req.user.username,
                reason: reason
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Ban failed',
            message: error.message
        });
    }
});

router.post('/unban', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        if (!profile.banned.status) {
            return res.status(400).json({
                error: 'User is not banned'
            });
        }
        
        profile.banned = {
            status: false,
            reason: '',
            bannedBy: '',
            bannedAt: null
        };
        
        await profile.save();
        
        res.json({
            message: 'User unbanned successfully',
            user: {
                discordId: profile.discordId,
                username: profile.username
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Unban failed',
            message: error.message
        });
    }
});

router.post('/givevbucks', validateVbucksAmount, async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        await profile.addVbucks(amount);
        
        const transaction = new Transaction({
            userId: profile.discordId,
            type: 'admin_grant',
            category: 'vbucks',
            amount: amount,
            currency: 'vbucks',
            adminId: req.user.discordId,
            paymentMethod: 'admin',
            description: `Admin ${req.user.username} granted ${amount} vbucks`
        });
        
        await transaction.save();
        
        res.json({
            message: 'Vbucks granted successfully',
            user: {
                discordId: profile.discordId,
                username: profile.username,
                newBalance: profile.vbucks
            },
            granted: amount
        });
    } catch (error) {
        res.status(500).json({
            error: 'Give vbucks failed',
            message: error.message
        });
    }
});

router.post('/setvbucks', validateVbucksAmount, async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        const oldBalance = profile.vbucks;
        profile.vbucks = amount;
        await profile.save();
        
        const transaction = new Transaction({
            userId: profile.discordId,
            type: 'admin_grant',
            category: 'vbucks',
            amount: amount,
            currency: 'vbucks',
            adminId: req.user.discordId,
            paymentMethod: 'admin',
            description: `Admin ${req.user.username} set vbucks from ${oldBalance} to ${amount}`
        });
        
        await transaction.save();
        
        res.json({
            message: 'Vbucks set successfully',
            user: {
                discordId: profile.discordId,
                username: profile.username,
                oldBalance: oldBalance,
                newBalance: profile.vbucks
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Set vbucks failed',
            message: error.message
        });
    }
});

router.post('/giveitem', async (req, res) => {
    try {
        const { userId, itemId, itemType } = req.body;
        
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        if (profile.hasItem(itemId)) {
            return res.status(400).json({
                error: 'User already owns this item'
            });
        }
        
        const cosmetic = await Cosmetic.findOne({ id: itemId });
        
        if (!cosmetic) {
            return res.status(404).json({
                error: 'Item not found in database'
            });
        }
        
        const categoryMap = {
            'outfit': 'outfits',
            'pickaxe': 'pickaxes',
            'glider': 'gliders',
            'backbling': 'backblings',
            'emote': 'emotes',
            'wrap': 'wraps'
        };
        
        const category = categoryMap[itemType];
        
        const item = {
            id: cosmetic.id,
            name: cosmetic.name,
            rarity: cosmetic.rarity,
            season: cosmetic.introduced?.season || 'Unknown'
        };
        
        await profile.addItem(item, category);
        
        const transaction = new Transaction({
            userId: profile.discordId,
            type: 'admin_grant',
            category: 'item',
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity
            },
            adminId: req.user.discordId,
            paymentMethod: 'admin',
            description: `Admin ${req.user.username} granted ${cosmetic.name}`
        });
        
        await transaction.save();
        
        res.json({
            message: 'Item granted successfully',
            user: {
                discordId: profile.discordId,
                username: profile.username
            },
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Give item failed',
            message: error.message
        });
    }
});

router.post('/removeitem', async (req, res) => {
    try {
        const { userId, itemId, itemType } = req.body;
        
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        if (!profile.hasItem(itemId)) {
            return res.status(400).json({
                error: 'User does not own this item'
            });
        }
        
        const categoryMap = {
            'outfit': 'outfits',
            'pickaxe': 'pickaxes',
            'glider': 'gliders',
            'backbling': 'backblings',
            'emote': 'emotes',
            'wrap': 'wraps'
        };
        
        const category = categoryMap[itemType];
        
        await profile.removeItem(itemId, category);
        
        res.json({
            message: 'Item removed successfully',
            user: {
                discordId: profile.discordId,
                username: profile.username
            },
            itemId: itemId
        });
    } catch (error) {
        res.status(500).json({
            error: 'Remove item failed',
            message: error.message
        });
    }
});

router.get('/viewaccount/:discordId', async (req, res) => {
    try {
        const { discordId } = req.params;
        
        const profile = await Profile.findOne({ discordId: discordId })
            .select('-password');
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        const transactions = await Transaction.find({ userId: discordId })
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.json({
            profile: profile,
            recentTransactions: transactions
        });
    } catch (error) {
        res.status(500).json({
            error: 'View account failed',
            message: error.message
        });
    }
});

router.delete('/deleteaccount/:discordId', async (req, res) => {
    try {
        const { discordId } = req.params;
        
        const profile = await Profile.findOne({ discordId: discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        await Transaction.deleteMany({ userId: discordId });
        await Profile.deleteOne({ discordId: discordId });
        
        res.json({
            message: 'Account deleted successfully',
            deletedUser: {
                discordId: profile.discordId,
                username: profile.username,
                email: profile.email
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Delete account failed',
            message: error.message
        });
    }
});

router.post('/refreshshop', async (req, res) => {
    try {
        await Shop.updateMany({ isActive: true }, { isActive: false });
        
        const allCosmetics = await Cosmetic.find({ availability: 'shop' });
        
        if (allCosmetics.length === 0) {
            return res.status(400).json({
                error: 'No cosmetics available in database'
            });
        }
        
        const shuffled = allCosmetics.sort(() => 0.5 - Math.random());
        
        const featuredItems = shuffled.slice(0, 6).map((item, index) => ({
            cosmeticId: item.id,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            price: item.price,
            displayOrder: index
        }));
        
        const dailyItems = shuffled.slice(6, 14).map((item, index) => ({
            cosmeticId: item.id,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            price: item.price,
            displayOrder: index
        }));
        
        const newShop = new Shop({
            date: new Date(),
            featured: featuredItems,
            daily: dailyItems,
            special: [],
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            season: config.project.season,
            version: config.project.version,
            isActive: true,
            createdBy: req.user.username,
            metadata: {
                totalItems: featuredItems.length + dailyItems.length,
                featuredCount: featuredItems.length,
                dailyCount: dailyItems.length,
                specialCount: 0
            }
        });
        
        await newShop.save();
        
        res.json({
            message: 'Shop refreshed successfully',
            shop: newShop
        });
    } catch (error) {
        res.status(500).json({
            error: 'Refresh shop failed',
            message: error.message
        });
    }
});

router.post('/broadcast', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Message cannot be empty'
            });
        }
        
        res.json({
            message: 'Broadcast sent successfully',
            broadcast: {
                message: message,
                sentBy: req.user.username,
                timestamp: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Broadcast failed',
            message: error.message
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await Profile.countDocuments();
        const bannedUsers = await Profile.countDocuments({ 'banned.status': true });
        const eliteDonators = await Profile.countDocuments({ 'roles.isEliteDonator': true });
        const fullLockers = await Profile.countDocuments({ 'roles.hasFullLocker': true });
        const boosters = await Profile.countDocuments({ 'roles.isBooster': true });
        
        const totalTransactions = await Transaction.countDocuments();
        const totalVbucksSpent = await Transaction.aggregate([
            { $match: { type: 'purchase', currency: 'vbucks' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const totalVbucksInCirculation = await Profile.aggregate([
            { $group: { _id: null, total: { $sum: '$vbucks' } } }
        ]);
        
        const activeShops = await Shop.countDocuments({ isActive: true });
        const totalCosmetics = await Cosmetic.countDocuments();
        
        res.json({
            users: {
                total: totalUsers,
                banned: bannedUsers,
                active: totalUsers - bannedUsers,
                eliteDonators: eliteDonators,
                fullLockers: fullLockers,
                boosters: boosters
            },
            economy: {
                totalTransactions: totalTransactions,
                totalVbucksSpent: totalVbucksSpent[0]?.total || 0,
                totalVbucksInCirculation: totalVbucksInCirculation[0]?.total || 0
            },
            shop: {
                activeShops: activeShops,
                totalCosmetics: totalCosmetics
            },
            server: {
                season: config.project.season,
                version: config.project.version,
                uptime: process.uptime()
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch stats',
            message: error.message
        });
    }
});

router.post('/maintenance', async (req, res) => {
    try {
        const { enabled } = req.body;
        
        res.json({
            message: 'Maintenance mode updated',
            maintenanceMode: enabled,
            updatedBy: req.user.username
        });
    } catch (error) {
        res.status(500).json({
            error: 'Maintenance toggle failed',
            message: error.message
        });
    }
});

router.delete('/cleardata', async (req, res) => {
    try {
        const { confirmPassword } = req.body;
        
        if (!confirmPassword) {
            return res.status(400).json({
                error: 'Password confirmation required'
            });
        }
        
        res.json({
            message: 'This is a dangerous operation. Implementation requires additional security measures.',
            warning: 'This endpoint should only be used in development environments'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Clear data failed',
            message: error.message
        });
    }
});

module.exports = router;