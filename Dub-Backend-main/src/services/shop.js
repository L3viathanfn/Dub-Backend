const Shop = require('../models/Shop');
const Cosmetic = require('../models/Cosmetic');
const config = require('../config/config');

const generateShopRotation = async () => {
    try {
        await Shop.updateMany({ isActive: true }, { isActive: false });
        
        const allCosmetics = await Cosmetic.find({ availability: 'shop' });
        
        if (allCosmetics.length === 0) {
            throw new Error('No cosmetics available for shop rotation');
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
            createdBy: 'system',
            metadata: {
                totalItems: featuredItems.length + dailyItems.length,
                featuredCount: featuredItems.length,
                dailyCount: dailyItems.length,
                specialCount: 0
            }
        });
        
        await newShop.save();
        
        console.log('Shop rotation generated successfully');
        return newShop;
    } catch (error) {
        console.error('Failed to generate shop rotation:', error);
        throw error;
    }
};

const getCurrentShop = async () => {
    try {
        const currentShop = await Shop.findOne({
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        
        return currentShop;
    } catch (error) {
        console.error('Failed to get current shop:', error);
        throw error;
    }
};

const checkAndRotateShop = async () => {
    try {
        const currentShop = await getCurrentShop();
        
        if (!currentShop || currentShop.expiresAt <= new Date()) {
            console.log('Shop expired or not found, generating new rotation');
            await generateShopRotation();
        }
    } catch (error) {
        console.error('Failed to check and rotate shop:', error);
    }
};

setInterval(checkAndRotateShop, 60 * 60 * 1000);

module.exports = {
    generateShopRotation,
    getCurrentShop,
    checkAndRotateShop
};