require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const chalk = require('chalk');

const config = require('./config/config');
const discordBot = require('./discord/bot');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const rewardRoutes = require('./routes/reward');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

mongoose.connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log(chalk.green('[DATABASE] Connected to MongoDB successfully'));
})
.catch((err) => {
    console.error(chalk.red('[DATABASE] Failed to connect to MongoDB:'), err);
    process.exit(1);
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/reward', rewardRoutes);

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        backend: 'DUB',
        version: config.project.version,
        season: config.project.season,
        message: 'DUB Backend is running successfully'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        uptime: process.uptime(),
        version: config.project.version,
        season: config.project.season,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.use((err, req, res, next) => {
    console.error(chalk.red('[ERROR]'), err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

const PORT = config.server.port;

app.listen(PORT, () => {
    console.log(chalk.cyan(`
==========================================
       DUB BACKEND SERVER
==========================================
    `));
    console.log(chalk.green(`[SERVER] Running on port ${PORT}`));
    console.log(chalk.green(`[PROJECT] Season ${config.project.season}`));
    console.log(chalk.green(`[VERSION] ${config.project.version}`));
    console.log(chalk.cyan(`[BATTLE PASS] ${config.defaults.battlepassCost} vbucks (FREE)`));
    console.log(chalk.cyan(`[STARTER VBUCKS] ${config.defaults.vbucks} vbucks`));
    console.log(chalk.cyan(`
==========================================
    `));
});

if (config.discord.token) {
    discordBot.login(config.discord.token)
        .then(() => {
            console.log(chalk.green('[DISCORD] Bot connected successfully'));
        })
        .catch((err) => {
            console.error(chalk.red('[DISCORD] Failed to connect bot:'), err);
        });
}

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n[SERVER] Shutting down gracefully...'));
    mongoose.connection.close(false, () => {
        process.exit(0);
    });
});

module.exports = app;