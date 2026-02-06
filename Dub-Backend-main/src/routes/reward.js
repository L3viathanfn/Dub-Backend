const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Profile = require('../models/Profile');
const Reward = require('../models/Reward');
const Transaction = require('../models/Transaction');
const config = require('../config/config');
const Cosmetic = require('../models/Cosmetic');

router.use(authMiddleware);

router.get('/available', async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        const availableRewards = [];
        
        if (profile.roles.isEliteDonator && !profile.rewards.eliteDonatorClaimed) {
            availableRewards.push({
                type: 'elite_donator',
                name: 'Elite Donator Reward',
                vbucks: config.rewards.eliteDonator.vbucks,
                items: config.rewards.eliteDonator.items,
                claimed: false
            });
        }
        
        if (profile.roles.hasFullLocker && !profile.rewards.fullLockerClaimed) {
            availableRewards.push({
                type: 'fulllocker',
                name: 'Full Locker Reward',
                description: config.rewards.fullLocker.description,
                maxSeason: config.rewards.fullLocker.maxSeason,
                claimed: false
            });
        }
        
        if (profile.roles.isBooster && !profile.rewards.boosterClaimed) {
            availableRewards.push({
                type: 'booster',
                name: 'Server Booster Reward',
                items: config.rewards.booster.items,
                claimed: false
            });
        }
        
        res.json({
            availableRewards: availableRewards,
            claimedRewards: {
                eliteDonator: profile.rewards.eliteDonatorClaimed,
                fullLocker: profile.rewards.fullLockerClaimed,
                booster: profile.rewards.boosterClaimed
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch available rewards',
            message: error.message
        });
    }
});

router.post('/claim/elite-donator', async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        if (!profile.roles.isEliteDonator) {
            return res.status(403).json({
                error: 'Elite Donator role required',
                message: 'You must have the Elite Donator role to claim this reward'
            });
        }
        
        if (profile.rewards.eliteDonatorClaimed) {
            return res.status(400).json({
                error: 'Reward already claimed',
                message: 'You have already claimed the Elite Donator reward'
            });
        }
        
        await profile.addVbucks(config.rewards.eliteDonator.vbucks);
        
        for (const item of config.rewards.eliteDonator.items) {
            const categoryMap = {
                'outfit': 'outfits',
                'pickaxe': 'pickaxes',
                'glider': 'gliders',
                'backbling': 'backblings',
                'emote': 'emotes',
                'wrap': 'wraps'
            };
            
            const category = categoryMap[item.type];
            
            if (!profile.hasItem(item.id)) {
                await profile.addItem({
                    id: item.id,
                    name: item.name,
                    rarity: item.rarity,
                    season: 'Elite Donator'
                }, category);
            }
        }
        
        profile.rewards.eliteDonatorClaimed = true;
        await profile.save();
        
        const transaction = new Transaction({
            userId: profile.discordId,
            type: 'reward_claim',
            category: 'elite_donator',
            amount: config.rewards.eliteDonator.vbucks,
            currency: 'vbucks',
            paymentMethod: 'reward',
            description: 'Claimed Elite Donator reward package'
        });
        
        await transaction.save();
        
        res.json({
            message: 'Elite Donator reward claimed successfully',
            rewards: {
                vbucks: config.rewards.eliteDonator.vbucks,
                items: config.rewards.eliteDonator.items
            },
            newBalance: profile.vbucks
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to claim Elite Donator reward',
            message: error.message
        });
    }
});

router.post('/claim/fulllocker', async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        if (!profile.roles.hasFullLocker) {
            return res.status(403).json({
                error: 'Full Locker role required',
                message: 'You must have the Full Locker role to claim this reward'
            });
        }
        
        if (profile.rewards.fullLockerClaimed) {
            return res.status(400).json({
                error: 'Reward already claimed',
                message: 'You have already claimed the Full Locker reward'
            });
        }
        
        const allCosmetics = await Cosmetic.find({
            'introduced.version': { $lte: config.rewards.fullLocker.maxSeason }
        });
        
        let addedCount = 0;
        
        for (const cosmetic of allCosmetics) {
            const categoryMap = {
                'outfit': 'outfits',
                'pickaxe': 'pickaxes',
                'glider': 'gliders',
                'backbling': 'backblings',
                'emote': 'emotes',
                'wrap': 'wraps'
            };
            
            const category = categoryMap[cosmetic.type];
            
            if (category && !profile.hasItem(cosmetic.id)) {
                await profile.addItem({
                    id: cosmetic.id,
                    name: cosmetic.name,
                    rarity: cosmetic.rarity,
                    season: cosmetic.introduced?.season || 'Unknown'
                }, category);
                addedCount++;
            }
        }
        
        profile.rewards.fullLockerClaimed = true;
        await profile.save();
        
        const transaction = new Transaction({
            userId: profile.discordId,
            type: 'reward_claim',
            category: 'fulllocker',
            paymentMethod: 'reward',
            description: `Claimed Full Locker reward - ${addedCount} items added`
        });
        
        await transaction.save();
        
        res.json({
            message: 'Full Locker reward claimed successfully',
            itemsAdded: addedCount,
            maxSeason: config.rewards.fullLocker.maxSeason
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to claim Full Locker reward',
            message: error.message
        });
    }
});

router.post('/claim/booster', async (req, res) => {
    try {
        const profile = await Profile.findOne({ discordId: req.user.discordId });
        
        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found'
            });
        }
        
        if (!profile.roles.isBooster) {
            return res.status(403).json({
                error: 'Booster role required',
                message: 'You must have the Server Booster role to claim this reward'
            });
        }
        
        if (profile.rewards.boosterClaimed) {
            return res.status(400).json({
                error: 'Reward already claimed',
                message: 'You have already claimed the Booster reward'
            });
        }
        
        for (const item of config.rewards.booster.items) {
            const categoryMap = {
                'outfit': 'outfits',
                'pickaxe': 'pickaxes',
                'glider': 'gliders',
                'backbling': 'backblings',
                'emote': 'emotes',
                'wrap': 'wraps'
            };
            
            const category = categoryMap[item.type];
            
            if (!profile.hasItem(item.id)) {
                await profile.addItem({
                    id: item.id,
                    name: item.name,
                    rarity: item.rarity,
                    season: 'Booster'
                }, category);
            }
        }
        
        profile.rewards.boosterClaimed = true;
        await profile.save();
        
        const transaction = new Transaction({
            userId: profile.discordId,
            type: 'reward_claim',
            category: 'booster',
            paymentMethod: 'reward',
            description: 'Claimed Server Booster reward'
        });
        
        await transaction.save();
        
        res.json({
            message: 'Booster reward claimed successfully',
            rewards: {
                items: config.rewards.booster.items
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to claim Booster reward',
            message: error.message
        });
    }
});

module.exports = router;