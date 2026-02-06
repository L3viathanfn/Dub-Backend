const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../../models/Profile');
const Transaction = require('../../../models/Transaction');
const Cosmetic = require('../../../models/Cosmetic');
const config = require('../../../config/config');
const discordBot = require('../../bot');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim a reward')
        .addStringOption(option =>
            option.setName('reward')
                .setDescription('The reward to claim')
                .setRequired(true)
                .addChoices(
                    { name: 'Elite Donator', value: 'elite-donator' },
                    { name: 'Full Locker', value: 'fulllocker' },
                    { name: 'Server Booster', value: 'booster' }
                )),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const reward = interaction.options.getString('reward');
            const profile = await Profile.findOne({ discordId: interaction.user.id });
            
            if (!profile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Profile Not Found')
                    .setDescription('You do not have a DUB account. Use /register to create one.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            if (reward === 'elite-donator') {
                if (!profile.roles.isEliteDonator) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Reward Unavailable')
                        .setDescription('You must have the Elite Donator role to claim this reward.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                if (profile.rewards.eliteDonatorClaimed) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Already Claimed')
                        .setDescription('You have already claimed the Elite Donator reward.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                await profile.addVbucks(config.rewards.eliteDonator.vbucks);
                
                for (const item of config.rewards.eliteDonator.items) {
                    const categoryMap = {
                        'outfit': 'outfits',
                        'pickaxe': 'pickaxes',
                        'glider': 'gliders',
                        'backbling': 'backblings',
                        'emote': 'emotes',
                        'wrap': 'wraps'
                    };
                    
                    const category = categoryMap[item.type];
                    
                    if (!profile.hasItem(item.id)) {
                        await profile.addItem({
                            id: item.id,
                            name: item.name,
                            rarity: item.rarity,
                            season: 'Elite Donator'
                        }, category);
                    }
                }
                
                profile.rewards.eliteDonatorClaimed = true;
                await profile.save();
                
                const transaction = new Transaction({
                    userId: profile.discordId,
                    type: 'reward_claim',
                    category: 'elite_donator',
                    amount: config.rewards.eliteDonator.vbucks,
                    currency: 'vbucks',
                    paymentMethod: 'reward',
                    description: 'Elite Donator reward claimed'
                });
                
                await transaction.save();
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('Elite Donator Reward Claimed')
                    .setDescription(`${interaction.user.username} (${interaction.user.id}) claimed the Elite Donator reward`)
                    .addFields(
                        { name: 'Vbucks Granted', value: `${config.rewards.eliteDonator.vbucks}`, inline: true },
                        { name: 'Items Granted', value: `${config.rewards.eliteDonator.items.length}`, inline: true }
                    )
                    .setTimestamp();
                
                await discordBot.sendLog('eliteDonatorLogs', logEmbed);
                
                const itemList = config.rewards.eliteDonator.items.map(item => item.name).join('\n');
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Elite Donator Reward Claimed')
                    .setDescription('Congratulations! You have claimed your Elite Donator reward.')
                    .addFields(
                        { name: 'Vbucks Received', value: `${config.rewards.eliteDonator.vbucks}`, inline: true },
                        { name: 'New Balance', value: `${profile.vbucks}`, inline: true },
                        { name: 'Items Received', value: itemList, inline: false }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                
            } else if (reward === 'fulllocker') {
                if (!profile.roles.hasFullLocker) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Reward Unavailable')
                        .setDescription('You must have the Full Locker role to claim this reward.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                if (profile.rewards.fullLockerClaimed) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Already Claimed')
                        .setDescription('You have already claimed the Full Locker reward.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                const allCosmetics = await Cosmetic.find({
                    'introduced.version': { $lte: config.rewards.fullLocker.maxSeason }
                });
                
                let addedCount = 0;
                
                for (const cosmetic of allCosmetics) {
                    const categoryMap = {
                        'outfit': 'outfits',
                        'pickaxe': 'pickaxes',
                        'glider': 'gliders',
                        'backbling': 'backblings',
                        'emote': 'emotes',
                        'wrap': 'wraps'
                    };
                    
                    const category = categoryMap[cosmetic.type];
                    
                    if (category && !profile.hasItem(cosmetic.id)) {
                        await profile.addItem({
                            id: cosmetic.id,
                            name: cosmetic.name,
                            rarity: cosmetic.rarity,
                            season: cosmetic.introduced?.season || 'Unknown'
                        }, category);
                        addedCount++;
                    }
                }
                
                profile.rewards.fullLockerClaimed = true;
                await profile.save();
                
                const transaction = new Transaction({
                    userId: profile.discordId,
                    type: 'reward_claim',
                    category: 'fulllocker',
                    paymentMethod: 'reward',
                    description: `Full Locker reward claimed - ${addedCount} items`
                });
                
                await transaction.save();
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF1493)
                    .setTitle('Full Locker Reward Claimed')
                    .setDescription(`${interaction.user.username} (${interaction.user.id}) claimed the Full Locker reward`)
                    .addFields(
                        { name: 'Items Added', value: `${addedCount}`, inline: true },
                        { name: 'Max Season', value: config.rewards.fullLocker.maxSeason, inline: true }
                    )
                    .setTimestamp();
                
                await discordBot.sendLog('fullLockerLogs', logEmbed);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Full Locker Reward Claimed')
                    .setDescription('Congratulations! You now have all cosmetics from the beginning up to the configured season.')
                    .addFields(
                        { name: 'Items Added', value: `${addedCount}`, inline: true },
                        { name: 'Max Season', value: config.rewards.fullLocker.maxSeason, inline: true }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                
            } else if (reward === 'booster') {
                if (!profile.roles.isBooster) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Reward Unavailable')
                        .setDescription('You must have the Server Booster role to claim this reward.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                if (profile.rewards.boosterClaimed) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Already Claimed')
                        .setDescription('You have already claimed the Server Booster reward.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                for (const item of config.rewards.booster.items) {
                    const categoryMap = {
                        'outfit': 'outfits',
                        'pickaxe': 'pickaxes',
                        'glider': 'gliders',
                        'backbling': 'backblings',
                        'emote': 'emotes',
                        'wrap': 'wraps'
                    };
                    
                    const category = categoryMap[item.type];
                    
                    if (!profile.hasItem(item.id)) {
                        await profile.addItem({
                            id: item.id,
                            name: item.name,
                            rarity: item.rarity,
                            season: 'Booster'
                        }, category);
                    }
                }
                
                profile.rewards.boosterClaimed = true;
                await profile.save();
                
                const transaction = new Transaction({
                    userId: profile.discordId,
                    type: 'reward_claim',
                    category: 'booster',
                    paymentMethod: 'reward',
                    description: 'Server Booster reward claimed'
                });
                
                await transaction.save();
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0xF47FFF)
                    .setTitle('Server Booster Reward Claimed')
                    .setDescription(`${interaction.user.username} (${interaction.user.id}) claimed the Server Booster reward`)
                    .addFields(
                        { name: 'Items Granted', value: `${config.rewards.booster.items.length}`, inline: true }
                    )
                    .setTimestamp();
                
                await discordBot.sendLog('boosterLogs', logEmbed);
                
                const itemList = config.rewards.booster.items.map(item => item.name).join('\n');
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Server Booster Reward Claimed')
                    .setDescription('Thank you for boosting our server!')
                    .addFields(
                        { name: 'Items Received', value: itemList, inline: false }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('Claim command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to claim reward. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};