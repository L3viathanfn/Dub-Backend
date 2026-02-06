const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    type: {
        type: String,
        required: true,
        enum: ['purchase', 'gift_sent', 'gift_received', 'admin_grant', 'reward_claim', 'payment']
    },
    
    category: {
        type: String,
        enum: ['item', 'vbucks', 'battlepass', 'fulllocker', 'elite_donator', 'booster']
    },
    
    amount: {
        type: Number,
        default: 0
    },
    
    currency: {
        type: String,
        enum: ['vbucks', 'usd'],
        default: 'vbucks'
    },
    
    item: {
        id: String,
        name: String,
        type: String,
        rarity: String
    },
    
    paymentMethod: {
        type: String,
        enum: ['sellauth', 'paypal', 'vbucks', 'admin', 'reward'],
        default: 'vbucks'
    },
    
    paymentDetails: {
        transactionId: String,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'completed'
        },
        paidAmount: Number,
        paymentEmail: String
    },
    
    recipientId: {
        type: String
    },
    
    adminId: {
        type: String
    },
    
    description: {
        type: String,
        default: ''
    },
    
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);