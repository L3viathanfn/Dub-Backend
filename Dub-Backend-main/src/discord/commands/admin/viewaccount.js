const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../../models/Profile');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewaccount')
        .setDescription('View a users account details')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const adminMember = await interaction.guild.members.fetch(interaction.user.id);
            
            if (!adminMember.roles.cache.has(config.discord.roles.admin)) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Permission Denied')
                    .setDescription('You do not have administrator permissions.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const targetUser = interaction.options.getUser('user');
            
            const profile = await Profile.findOne({ discordId: targetUser.id });
            
            if (!profile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('User Not Found')
                    .setDescription('This user does not have a DUB account.')
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
                .setTitle(`Account Details: ${profile.username}`)
                .addFields(
                    { name: 'Discord ID', value: profile.discordId, inline: true },
                    { name: 'Email', value: profile.email, inline: true },
                    { name: 'Vbucks', value: `${profile.vbucks}`, inline: true },
                    { name: 'Total Items', value: `${totalItems}`, inline: true },
                    { name: 'Battle Pass Tier', value: `${profile.battlePass.tier}`, inline: true },
                    { name: 'Roles', value: roles.length > 0 ? roles.join(', ') : 'None', inline: true },
                    { name: 'Account Created', value: new Date(profile.createdAt).toLocaleDateString(), inline: true },
                    { name: 'Last Login', value: new Date(profile.lastLogin).toLocaleDateString(), inline: true }
                )
                .setTimestamp();
            
            if (profile.banned.status) {
                embed.addFields(
                    { name: 'Banned', value: `Yes\nReason: ${profile.banned.reason}\nBanned By: ${profile.banned.bannedBy}`, inline: false }
                );
                embed.setColor(0xFF0000);
            }
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('View account command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to view account. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};