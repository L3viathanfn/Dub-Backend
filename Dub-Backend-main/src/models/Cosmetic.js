const mongoose = require('mongoose');

const CosmeticSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    name: {
        type: String,
        required: true
    },
    
    description: {
        type: String,
        default: ''
    },
    
    type: {
        type: String,
        required: true,
        enum: ['outfit', 'pickaxe', 'glider', 'backbling', 'emote', 'wrap', 'bundle']
    },
    
    rarity: {
        type: String,
        required: true,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'marvel', 'dc', 'icon', 'gaming']
    },
    
    price: {
        type: Number,
        required: true
    },
    
    series: {
        type: String,
        default: ''
    },
    
    set: {
        type: String,
        default: ''
    },
    
    introduced: {
        season: String,
        version: String,
        chapter: String
    },
    
    shopHistory: [{
        date: Date,
        section: String
    }],
    
    bundle: {
        isBundle: {
            type: Boolean,
            default: false
        },
        items: [{
            id: String,
            name: String,
            type: String
        }]
    },
    
    images: {
        icon: String,
        featured: String,
        background: String
    },
    
    availability: {
        type: String,
        enum: ['shop', 'battlepass', 'exclusive', 'event', 'starter'],
        default: 'shop'
    },
    
    reactive: {
        type: Boolean,
        default: false
    },
    
    animated: {
        type: Boolean,
        default: false
    },
    
    tags: [String],
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

CosmeticSchema.index({ type: 1, rarity: 1 });
CosmeticSchema.index({ availability: 1 });

module.exports = mongoose.model('Cosmetic', CosmeticSchema);