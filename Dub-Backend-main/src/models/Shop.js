const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,
        index: true
    },
    
    featured: [{
        cosmeticId: {
            type: String,
            required: true
        },
        name: String,
        type: String,
        rarity: String,
        price: Number,
        displayOrder: Number
    }],
    
    daily: [{
        cosmeticId: {
            type: String,
            required: true
        },
        name: String,
        type: String,
        rarity: String,
        price: Number,
        displayOrder: Number
    }],
    
    special: [{
        cosmeticId: {
            type: String,
            required: true
        },
        name: String,
        type: String,
        rarity: String,
        price: Number,
        displayOrder: Number,
        section: String
    }],
    
    expiresAt: {
        type: Date,
        required: true
    },
    
    season: {
        type: Number,
        required: true
    },
    
    version: {
        type: String,
        required: true
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    createdBy: {
        type: String,
        default: 'system'
    },
    
    metadata: {
        totalItems: Number,
        featuredCount: Number,
        dailyCount: Number,
        specialCount: Number
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

ShopSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('Shop', ShopSchema);