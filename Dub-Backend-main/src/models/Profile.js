const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    username: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    
    password: {
        type: String,
        required: true
    },
    
    vbucks: {
        type: Number,
        default: 1000
    },
    
    locker: {
        outfits: [{
            id: String,
            name: String,
            rarity: String,
            season: String
        }],
        pickaxes: [{
            id: String,
            name: String,
            rarity: String,
            season: String
        }],
        gliders: [{
            id: String,
            name: String,
            rarity: String,
            season: String
        }],
        backblings: [{
            id: String,
            name: String,
            rarity: String,
            season: String
        }],
        emotes: [{
            id: String,
            name: String,
            rarity: String,
            season: String
        }],
        wraps: [{
            id: String,
            name: String,
            rarity: String,
            season: String
        }]
    },
    
    battlePass: {
        owned: {
            type: Boolean,
            default: true
        },
        tier: {
            type: Number,
            default: 1
        },
        stars: {
            type: Number,
            default: 0
        }
    },
    
    stats: {
        wins: { type: Number, default: 0 },
        kills: { type: Number, default: 0 },
        deaths: { type: Number, default: 0 },
        matchesPlayed: { type: Number, default: 0 },
        minutesPlayed: { type: Number, default: 0 }
    },
    
    roles: {
        isAdmin: { type: Boolean, default: false },
        hasFullLocker: { type: Boolean, default: false },
        isEliteDonator: { type: Boolean, default: false },
        isBooster: { type: Boolean, default: false }
    },
    
    rewards: {
        fullLockerClaimed: { type: Boolean, default: false },
        eliteDonatorClaimed: { type: Boolean, default: false },
        boosterClaimed: { type: Boolean, default: false }
    },
    
    banned: {
        status: { type: Boolean, default: false },
        reason: { type: String, default: '' },
        bannedBy: { type: String, default: '' },
        bannedAt: { type: Date, default: null }
    },
    
    settings: {
        emailNotifications: { type: Boolean, default: true },
        discordNotifications: { type: Boolean, default: true }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

ProfileSchema.methods.addVbucks = function(amount) {
    this.vbucks += amount;
    return this.save();
};

ProfileSchema.methods.removeVbucks = function(amount) {
    if (this.vbucks < amount) {
        throw new Error('Insufficient vbucks');
    }
    this.vbucks -= amount;
    return this.save();
};

ProfileSchema.methods.addItem = function(item, category) {
    if (!this.locker[category]) {
        throw new Error('Invalid category');
    }
    
    const exists = this.locker[category].some(i => i.id === item.id);
    if (!exists) {
        this.locker[category].push(item);
        return this.save();
    }
    return this;
};

ProfileSchema.methods.removeItem = function(itemId, category) {
    if (!this.locker[category]) {
        throw new Error('Invalid category');
    }
    
    this.locker[category] = this.locker[category].filter(i => i.id !== itemId);
    return this.save();
};

ProfileSchema.methods.hasItem = function(itemId) {
    const categories = ['outfits', 'pickaxes', 'gliders', 'backblings', 'emotes', 'wraps'];
    for (const category of categories) {
        if (this.locker[category].some(i => i.id === itemId)) {
            return true;
        }
    }
    return false;
};

module.exports = mongoose.model('Profile', ProfileSchema);