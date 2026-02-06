const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../../models/Profile');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rewards')
        .setDescription('View your available rewards'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const profile = await Profile.findOne({ discordId: interaction.user.id });
            
            if (!profile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Profile Not Found')
                    .setDescription('You do not have a DUB account. Use /register to create one.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const availableRewards = [];
            const claimedRewards = [];
            
            if (profile.roles.isEliteDonator) {
                if (!profile.rewards.eliteDonatorClaimed) {
                    availableRewards.push({
                        name: 'Elite Donator Reward',
                        value: `${config.rewards.eliteDonator.vbucks} vbucks + ${config.rewards.eliteDonator.items.length} exclusive items\nUse /claim elite-donator to claim`
                    });
                } else {
                    claimedRewards.push('Elite Donator');
                }
            }
            
            if (profile.roles.hasFullLocker) {
                if (!profile.rewards.fullLockerClaimed) {
                    availableRewards.push({
                        name: 'Full Locker Reward',
                        value: `All cosmetics from V0.00 to ${config.rewards.fullLocker.maxSeason}\nUse /claim fulllocker to claim`
                    });
                } else {
                    claimedRewards.push('Full Locker');
                }
            }
            
            if (profile.roles.isBooster) {
                if (!profile.rewards.boosterClaimed) {
                    availableRewards.push({
                        name: 'Server Booster Reward',
                        value: `${config.rewards.booster.items.length} exclusive item(s)\nUse /claim booster to claim`
                    });
                } else {
                    claimedRewards.push('Server Booster');
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('Your Rewards')
                .setTimestamp();
            
            if (availableRewards.length > 0) {
                availableRewards.forEach(reward => {
                    embed.addFields({ name: reward.name, value: reward.value, inline: false });
                });
            } else {
                embed.setDescription('You have no available rewards to claim.');
            }
            
            if (claimedRewards.length > 0) {
                embed.addFields({ 
                    name: 'Already Claimed', 
                    value: claimedRewards.join(', '), 
                    inline: false 
                });
            }
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Rewards command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to fetch rewards. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};