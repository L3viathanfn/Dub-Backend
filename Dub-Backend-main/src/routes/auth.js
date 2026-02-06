const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Profile = require('../models/Profile');
const Transaction = require('../models/Transaction');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { discordId, username, email, password } = req.body;
        
        const existingProfile = await Profile.findOne({
            $or: [{ email }, { discordId }]
        });
        
        if (existingProfile) {
            return res.status(400).json({
                error: 'Registration failed',
                message: existingProfile.email === email 
                    ? 'Email already registered' 
                    : 'Discord ID already registered'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const profile = new Profile({
            discordId,
            username,
            email,
            password: hashedPassword,
            vbucks: config.defaults.vbucks,
            battlePass: {
                owned: true,
                tier: 1,
                stars: 0
            }
        });
        
        profile.locker.outfits.push(config.defaults.starterSkin);
        
        await profile.save();
        
        const vbucksTransaction = new Transaction({
            userId: discordId,
            type: 'admin_grant',
            category: 'vbucks',
            amount: config.defaults.vbucks,
            currency: 'vbucks',
            paymentMethod: 'admin',
            description: 'Welcome bonus - starter vbucks'
        });
        
        await vbucksTransaction.save();
        
        const skinTransaction = new Transaction({
            userId: discordId,
            type: 'admin_grant',
            category: 'item',
            item: {
                id: config.defaults.starterSkin.id,
                name: config.defaults.starterSkin.name,
                type: config.defaults.starterSkin.type
            },
            paymentMethod: 'admin',
            description: 'Welcome bonus - Crystal outfit'
        });
        
        await skinTransaction.save();
        
        const token = jwt.sign(
            { discordId: profile.discordId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        
        res.status(201).json({
            message: 'Registration successful',
            token,
            profile: {
                discordId: profile.discordId,
                username: profile.username,
                email: profile.email,
                vbucks: profile.vbucks,
                battlePass: profile.battlePass,
                starterSkin: config.defaults.starterSkin
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const profile = await Profile.findOne({ email });
        
        if (!profile) {
            return res.status(401).json({
                error: 'Login failed',
                message: 'Invalid email or password'
            });
        }
        
        if (profile.banned.status) {
            return res.status(403).json({
                error: 'Account banned',
                message: `Your account has been banned. Reason: ${profile.banned.reason}`,
                bannedAt: profile.banned.bannedAt,
                bannedBy: profile.banned.bannedBy
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, profile.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Login failed',
                message: 'Invalid email or password'
            });
        }
        
        profile.lastLogin = new Date();
        await profile.save();
        
        const token = jwt.sign(
            { discordId: profile.discordId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        
        res.json({
            message: 'Login successful',
            token,
            profile: {
                discordId: profile.discordId,
                username: profile.username,
                email: profile.email,
                vbucks: profile.vbucks,
                roles: profile.roles,
                lastLogin: profile.lastLogin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                valid: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, config.jwt.secret);
        const profile = await Profile.findOne({ discordId: decoded.discordId });
        
        if (!profile) {
            return res.status(401).json({
                valid: false,
                message: 'User not found'
            });
        }
        
        if (profile.banned.status) {
            return res.status(403).json({
                valid: false,
                message: 'Account is banned'
            });
        }
        
        res.json({
            valid: true,
            user: {
                discordId: profile.discordId,
                username: profile.username,
                roles: profile.roles
            }
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            message: 'Invalid or expired token'
        });
    }
});

module.exports = router;