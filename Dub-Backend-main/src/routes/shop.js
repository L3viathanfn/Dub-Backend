const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Cosmetic = require('../models/Cosmetic');

router.get('/current', async (req, res) => {
    try {
        const currentShop = await Shop.findOne({
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        
        if (!currentShop) {
            return res.status(404).json({
                error: 'No active shop found'
            });
        }
        
        const timeRemaining = currentShop.expiresAt - new Date();
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        res.json({
            shop: currentShop,
            timeRemaining: {
                hours: hoursRemaining,
                minutes: minutesRemaining,
                expiresAt: currentShop.expiresAt
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch current shop',
            message: error.message
        });
    }
});

router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        const shops = await Shop.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
        
        const total = await Shop.countDocuments();
        
        res.json({
            shops: shops,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch shop history',
            message: error.message
        });
    }
});

router.get('/item/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const cosmetic = await Cosmetic.findOne({ id: itemId });
        
        if (!cosmetic) {
            return res.status(404).json({
                error: 'Item not found'
            });
        }
        
        res.json({
            item: cosmetic
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch item',
            message: error.message
        });
    }
});

module.exports = router;