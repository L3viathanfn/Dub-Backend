module.exports = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    
    project: {
        name: 'DUB',
        season: parseInt(process.env.PROJECT_SEASON) || 15,
        version: process.env.PROJECT_VERSION || '15.30'
    },
    
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dub'
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_change_in_production',
        expiresIn: '30d'
    },
    
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        guildId: process.env.DISCORD_GUILD_ID,
        roles: {
            admin: process.env.ROLE_ADMIN,
            fullLocker: process.env.ROLE_FULLLOCKER,
            eliteDonator: process.env.ROLE_ELITE_DONATOR,
            booster: process.env.ROLE_BOOSTER
        },
        channels: {
            logs: process.env.CHANNEL_LOGS,
            fullLockerLogs: process.env.CHANNEL_FULLLOCKER_LOGS,
            eliteDonatorLogs: process.env.CHANNEL_ELITE_DONATOR_LOGS,
            boosterLogs: process.env.CHANNEL_BOOSTER_LOGS
        }
    },
    
    email: {
        enabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD
    },
    
    payment: {
        sellauth: {
            enabled: !!process.env.SELLAUTH_API_KEY,
            apiKey: process.env.SELLAUTH_API_KEY || ''
        },
        paypal: {
            enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || ''
        }
    },
    
    defaults: {
        vbucks: parseInt(process.env.DEFAULT_VBUCKS) || 1000,
        battlepassCost: parseInt(process.env.BATTLEPASS_COST) || 0,
        starterSkin: {
            id: 'CID_493_Athena_Commando_F_JurassicArchaeology',
            name: 'Crystal',
            type: 'outfit',
            rarity: 'epic'
        }
    },
    
    rewards: {
        eliteDonator: {
            vbucks: parseInt(process.env.ELITE_DONATOR_VBUCKS) || 5000,
            items: [
                { id: 'CID_530_Athena_Commando_F_BlackMonday_1BV6J', name: 'Catwoman Comic Book Outfit', type: 'outfit', rarity: 'dc' },
                { id: 'CID_703_Athena_Commando_M_Cyclone', name: 'Travis Scott', type: 'outfit', rarity: 'icon' },
                { id: 'CID_715_Athena_Commando_F_TwinDark', name: 'Echo', type: 'outfit', rarity: 'epic' },
                { id: 'Pickaxe_ID_376_FNCS', name: 'The Axe of Champions', type: 'pickaxe', rarity: 'legendary' },
                { id: 'Pickaxe_ID_179_StarWand', name: 'Star Wand', type: 'pickaxe', rarity: 'rare' },
                { id: 'Pickaxe_ID_014_WinterCamo', name: 'Ice Breaker', type: 'pickaxe', rarity: 'uncommon' }
            ]
        },
        booster: {
            items: [
                { id: 'CID_362_Athena_Commando_F_BandageNinja', name: 'Kuno', type: 'outfit', rarity: 'epic' }
            ]
        },
        fullLocker: {
            maxSeason: process.env.FULLLOCKER_MAX_SEASON || '15.30',
            description: 'All cosmetics from V0.00 to the defined project version'
        }
    }
};