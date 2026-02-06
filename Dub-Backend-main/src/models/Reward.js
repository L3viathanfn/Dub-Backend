const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    rewardType: {
        type: String,
        required: true,
        enum: ['fulllocker', 'elite_donator', 'booster', 'event', 'custom']
    },
    
    status: {
        type: String,
        enum: ['available', 'claimed', 'expired'],
        default: 'available'
    },
    
    items: [{
        id: String,
        name: String,
        type: String,
        rarity: String
    }],
    
    vbucksReward: {
        type: Number,
        default: 0
    },
    
    requirements: {
        hasRole: {
            type: Boolean,
            default: false
        },
        hasPaid: {
            type: Boolean,
            default: false
        },
        paymentMethod: {
            type: String,
            enum: ['sellauth', 'paypal', 'none'],
            default: 'none'
        }
    },
    
    claimedAt: {
        type: Date,
        default: null
    },
    
    expiresAt: {
        type: Date,
        default: null
    },
    
    metadata: {
        paymentId: String,
        adminGranted: Boolean,
        grantedBy: String
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

RewardSchema.index({ userId: 1, status: 1 });
RewardSchema.index({ rewardType: 1, status: 1 });

module.exports = mongoose.model('Reward', RewardSchema);