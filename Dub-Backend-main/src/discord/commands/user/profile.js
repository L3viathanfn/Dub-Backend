const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../../models/Profile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your DUB profile'),
    
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
            
            const totalItems = 
                profile.locker.outfits.length +
                profile.locker.pickaxes.length +
                profile.locker.gliders.length +
                profile.locker.backblings.length +
                profile.locker.emotes.length +
                profile.locker.wraps.length;
            
            const roles = [];
            if (profile.roles.isAdmin) roles.push('Admin');
            if (profile.roles.isEliteDonator) roles.push('Elite Donator');
            if (profile.roles.hasFullLocker) roles.push('Full Locker');
            if (profile.roles.isBooster) roles.push('Server Booster');
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`${profile.username}'s Profile`)
                .addFields(
                    { name: 'Vbucks Balance', value: `${profile.vbucks} vbucks`, inline: true },
                    { name: 'Total Items', value: `${totalItems} items`, inline: true },
                    { name: 'Battle Pass Tier', value: `Tier ${profile.battlePass.tier}`, inline: true },
                    { name: 'Locker', value: `Outfits: ${profile.locker.outfits.length}\nPickaxes: ${profile.locker.pickaxes.length}\nGliders: ${profile.locker.gliders.length}\nBackblings: ${profile.locker.backblings.length}\nEmotes: ${profile.locker.emotes.length}\nWraps: ${profile.locker.wraps.length}`, inline: true },
                    { name: 'Stats', value: `Wins: ${profile.stats.wins}\nKills: ${profile.stats.kills}\nMatches: ${profile.stats.matchesPlayed}`, inline: true },
                    { name: 'Roles', value: roles.length > 0 ? roles.join(', ') : 'None', inline: true },
                    { name: 'Account Created', value: new Date(profile.createdAt).toLocaleDateString(), inline: true },
                    { name: 'Last Login', value: new Date(profile.lastLogin).toLocaleDateString(), inline: true }
                )
                .setTimestamp();
            
            if (profile.banned.status) {
                embed.addFields(
                    { name: 'Account Status', value: `BANNED\nReason: ${profile.banned.reason}`, inline: false }
                );
                embed.setColor(0xFF0000);
            }
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Profile command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to fetch profile. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};