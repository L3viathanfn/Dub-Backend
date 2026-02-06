const Joi = require('joi');

const validateRegistration = (req, res, next) => {
    const schema = Joi.object({
        discordId: Joi.string().required().min(17).max(19),
        username: Joi.string().required().min(2).max(32),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(8).max(128)
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            message: error.details[0].message
        });
    }
    
    next();
};

const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            message: error.details[0].message
        });
    }
    
    next();
};

const validateVbucksAmount = (req, res, next) => {
    const schema = Joi.object({
        amount: Joi.number().integer().min(1).max(1000000).required()
    });
    
    const { error } = schema.validate({ amount: req.body.amount || req.params.amount });
    
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Amount must be a positive integer between 1 and 1,000,000'
        });
    }
    
    next();
};

const validateItemPurchase = (req, res, next) => {
    const schema = Joi.object({
        itemId: Joi.string().required(),
        itemType: Joi.string().valid('outfit', 'pickaxe', 'glider', 'backbling', 'emote', 'wrap').required()
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            message: error.details[0].message
        });
    }
    
    next();
};

const validateGift = (req, res, next) => {
    const schema = Joi.object({
        recipientId: Joi.string().required().min(17).max(19),
        itemId: Joi.string().required(),
        itemType: Joi.string().valid('outfit', 'pickaxe', 'glider', 'backbling', 'emote', 'wrap').required()
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            message: error.details[0].message
        });
    }
    
    next();
};

const validateBan = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().required().min(17).max(19),
        reason: Joi.string().required().min(3).max(500)
    });
    
    const { error } = schema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            message: error.details[0].message
        });
    }
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateVbucksAmount,
    validateItemPurchase,
    validateGift,
    validateBan
};