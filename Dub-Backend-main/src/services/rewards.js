const Profile = require('../models/Profile');
const Reward = require('../models/Reward');
const Transaction = require('../models/Transaction');
const config = require('../config/config');
const Cosmetic = require('../models/Cosmetic');

const grantEliteDonatorReward = async (userId) => {
    try {
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            throw new Error('User not found');
        }
        
        if (profile.rewards.eliteDonatorClaimed) {
            throw new Error('Elite Donator reward already claimed');
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
            description: 'Elite Donator reward granted'
        });
        
        await transaction.save();
        
        return {
            success: true,
            vbucks: config.rewards.eliteDonator.vbucks,
            items: config.rewards.eliteDonator.items
        };
    } catch (error) {
        console.error('Failed to grant Elite Donator reward:', error);
        throw error;
    }
};

const grantFullLockerReward = async (userId) => {
    try {
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            throw new Error('User not found');
        }
        
        if (profile.rewards.fullLockerClaimed) {
            throw new Error('Full Locker reward already claimed');
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
            description: `Full Locker reward granted - ${addedCount} items`
        });
        
        await transaction.save();
        
        return {
            success: true,
            itemsAdded: addedCount,
            maxSeason: config.rewards.fullLocker.maxSeason
        };
    } catch (error) {
        console.error('Failed to grant Full Locker reward:', error);
        throw error;
    }
};

const grantBoosterReward = async (userId) => {
    try {
        const profile = await Profile.findOne({ discordId: userId });
        
        if (!profile) {
            throw new Error('User not found');
        }
        
        if (profile.rewards.boosterClaimed) {
            throw new Error('Booster reward already claimed');
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
            description: 'Server Booster reward granted'
        });
        
        await transaction.save();
        
        return {
            success: true,
            items: config.rewards.booster.items
        };
    } catch (error) {
        console.error('Failed to grant Booster reward:', error);
        throw error;
    }
};

module.exports = {
    grantEliteDonatorReward,
    grantFullLockerReward,
    grantBoosterReward
};