const axios = require('axios');
const config = require('../config/config');
const Transaction = require('../models/Transaction');
const Profile = require('../models/Profile');

const processSellAuthPayment = async (transactionId, userId, amount, productId) => {
    if (!config.payment.sellauth.enabled) {
        throw new Error('SellAuth payment gateway is not enabled');
    }
    
    try {
        const response = await axios.post('https://api.sellauth.com/v1/transactions/verify', {
            transaction_id: transactionId
        }, {
            headers: {
                'Authorization': `Bearer ${config.payment.sellauth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.status === 'completed') {
            const transaction = new Transaction({
                userId: userId,
                type: 'payment',
                category: productId,
                amount: amount,
                currency: 'usd',
                paymentMethod: 'sellauth',
                paymentDetails: {
                    transactionId: transactionId,
                    status: 'completed',
                    paidAmount: amount
                },
                description: `SellAuth payment for ${productId}`
            });
            
            await transaction.save();
            
            return {
                success: true,
                transaction: transaction
            };
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error('SellAuth payment processing failed:', error);
        throw error;
    }
};

const processPayPalPayment = async (orderId, userId, amount, productId) => {
    if (!config.payment.paypal.enabled) {
        throw new Error('PayPal payment gateway is not enabled');
    }
    
    try {
        const auth = Buffer.from(`${config.payment.paypal.clientId}:${config.payment.paypal.clientSecret}`).toString('base64');
        
        const response = await axios.post(`https://api${config.payment.paypal.mode === 'sandbox' ? '-m.sandbox' : ''}.paypal.com/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.status === 'COMPLETED') {
            const transaction = new Transaction({
                userId: userId,
                type: 'payment',
                category: productId,
                amount: amount,
                currency: 'usd',
                paymentMethod: 'paypal',
                paymentDetails: {
                    transactionId: orderId,
                    status: 'completed',
                    paidAmount: amount
                },
                description: `PayPal payment for ${productId}`
            });
            
            await transaction.save();
            
            return {
                success: true,
                transaction: transaction
            };
        } else {
            throw new Error('PayPal payment capture failed');
        }
    } catch (error) {
        console.error('PayPal payment processing failed:', error);
        throw error;
    }
};

const verifyCashAppPayment = async (userId, cashtag, amount, productId) => {
    const transaction = new Transaction({
        userId: userId,
        type: 'payment',
        category: productId,
        amount: amount,
        currency: 'usd',
        paymentMethod: 'cashapp',
        paymentDetails: {
            transactionId: `cashapp_${Date.now()}`,
            status: 'pending',
            paidAmount: amount,
            paymentEmail: cashtag
        },
        description: `CashApp payment pending verification for ${productId}`
    });
    
    await transaction.save();
    
    return {
        success: true,
        message: 'CashApp payment recorded, awaiting manual verification',
        transaction: transaction
    };
};

module.exports = {
    processSellAuthPayment,
    processPayPalPayment,
    verifyCashAppPayment
};