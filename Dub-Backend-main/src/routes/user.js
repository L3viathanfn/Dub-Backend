const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Profile = require('../models/Profile');
const Transaction = require('../models/Transaction');
const Cosmetic = require('../models/Cosmetic');
const Shop = require('../models/Shop');
const { validateItemPurchase, validateGift } = require('../middleware/validation');

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId })
            .select('-password');
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        res.json({
            profile: profile
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch profile',
            message: error.message
        });
    }
});

router.get('/locker', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        const totalItems = 
            profile.locker.outfits.length +
            profile.locker.pickaxes.length +
            profile.locker.gliders.length +
            profile.locker.backblings.length +
            profile.locker.emotes.length +
            profile.locker.wraps.length;
        
        res.json({
            locker: profile.locker,
            stats: {
                totalItems: totalItems,
                outfits: profile.locker.outfits.length,
                pickaxes: profile.locker.pickaxes.length,
                gliders: profile.locker.gliders.length,
                backblings: profile.locker.backblings.length,
                emotes: profile.locker.emotes.length,
                wraps: profile.locker.wraps.length
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch locker',
            message: error.message
        });
    }
});

router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        const kd = profile.stats.deaths > 0 
            ? (profile.stats.kills / profile.stats.deaths).toFixed(2)
            : profile.stats.kills.toFixed(2);
        
        const winRate = profile.stats.matchesPlayed > 0
            ? ((profile.stats.wins / profile.stats.matchesPlayed) * 100).toFixed(2)
            : '0.00';
        
        res.json({
            stats: profile.stats,
            calculated: {
                kd: parseFloat(kd),
                winRate: parseFloat(winRate)
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch stats',
            message: error.message
        });
    }
});

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        res.json({
            vbucks: profile.vbucks
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch balance',
            message: error.message
        });
    }
});

router.post('/buy', authMiddleware, validateItemPurchase, async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        if (profile.hasItem(itemId)) {
            return res.status(400).json({
                error: 'Item already owned'
            });
        }
        
        const cosmetic = await Cosmetic.findOne({ id: itemId });
        
        if (!cosmetic) {
            return res.status(404).json({
                error: 'Item not found in database'
            });
        }
        
        const currentShop = await Shop.findOne({ 
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
        
        if (!currentShop) {
            return res.status(404).json({
                error: 'No active shop found'
            });
        }
        
        const itemInShop = [...currentShop.featured, ...currentShop.daily, ...currentShop.special]
            .some(item => item.cosmeticId === itemId);
        
        if (!itemInShop) {
            return res.status(400).json({
                error: 'Item not available in current shop'
            });
        }
        
        if (profile.vbucks < cosmetic.price) {
            return res.status(400).json({
                error: 'Insufficient vbucks',
                required: cosmetic.price,
                current: profile.vbucks,
                needed: cosmetic.price - profile.vbucks
            });
        }
        
        await profile.removeVbucks(cosmetic.price);
        
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
            type: 'purchase',
            category: 'item',
            amount: cosmetic.price,
            currency: 'vbucks',
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity
            },
            paymentMethod: 'vbucks',
            description: `Purchased ${cosmetic.name} from item shop`
        });
        
        await transaction.save();
        
        res.json({
            message: 'Purchase successful',
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity,
                price: cosmetic.price
            },
            newBalance: profile.vbucks
        });
    } catch (error) {
        res.status(500).json({
            error: 'Purchase failed',
            message: error.message
        });
    }
});

router.post('/gift', authMiddleware, validateGift, async (req, res) => {
    try {
        const { recipientId, itemId, itemType } = req.body;
        
        if (req.user.discordId === recipientId) {
            return res.status(400).json({
                error: 'Cannot gift to yourself'
            });
        }
        
        const sender = await Profile.findOne({ discordId: req.user.discordId });
        const recipient = await Profile.findOne({ discordId: recipientId });
        
        if (!recipient) {
            return res.status(404).json({
                error: 'Recipient not found'
            });
        }
        
        if (recipient.hasItem(itemId)) {
            return res.status(400).json({
                error: 'Recipient already owns this item'
            });
        }
        
        const cosmetic = await Cosmetic.findOne({ id: itemId });
        
        if (!cosmetic) {
            return res.status(404).json({
                error: 'Item not found'
            });
        }
        
        const currentShop = await Shop.findOne({ 
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
        
        if (!currentShop) {
            return res.status(404).json({
                error: 'No active shop found'
            });
        }
        
        const itemInShop = [...currentShop.featured, ...currentShop.daily, ...currentShop.special]
            .some(item => item.cosmeticId === itemId);
        
        if (!itemInShop) {
            return res.status(400).json({
                error: 'Item not available in current shop'
            });
        }
        
        if (sender.vbucks < cosmetic.price) {
            return res.status(400).json({
                error: 'Insufficient vbucks to gift',
                required: cosmetic.price,
                current: sender.vbucks
            });
        }
        
        await sender.removeVbucks(cosmetic.price);
        
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
        
        await recipient.addItem(item, category);
        
        const senderTransaction = new Transaction({
            userId: sender.discordId,
            type: 'gift_sent',
            category: 'item',
            amount: cosmetic.price,
            currency: 'vbucks',
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity
            },
            recipientId: recipient.discordId,
            paymentMethod: 'vbucks',
            description: `Gifted ${cosmetic.name} to ${recipient.username}`
        });
        
        await senderTransaction.save();
        
        const recipientTransaction = new Transaction({
            userId: recipient.discordId,
            type: 'gift_received',
            category: 'item',
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity
            },
            adminId: sender.discordId,
            paymentMethod: 'admin',
            description: `Received ${cosmetic.name} as gift from ${sender.username}`
        });
        
        await recipientTransaction.save();
        
        res.json({
            message: 'Gift sent successfully',
            item: {
                id: cosmetic.id,
                name: cosmetic.name,
                type: cosmetic.type,
                rarity: cosmetic.rarity,
                price: cosmetic.price
            },
            recipient: {
                discordId: recipient.discordId,
                username: recipient.username
            },
            newBalance: sender.vbucks
        });
    } catch (error) {
        res.status(500).json({
            error: 'Gift failed',
            message: error.message
        });
    }
});

router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        const transactions = await Transaction.find({ userId: req.user.discordId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
        
        const total = await Transaction.countDocuments({ userId: req.user.discordId });
        
        res.json({
            transactions: transactions,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch transactions',
            message: error.message
        });
    }
});

module.exports = router;