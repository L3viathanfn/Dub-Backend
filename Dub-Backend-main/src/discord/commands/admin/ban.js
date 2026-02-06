const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../../models/Profile');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from DUB')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
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
            const reason = interaction.options.getString('reason');
            
            const profile = await Profile.findOne({ discordId: targetUser.id });
            
            if (!profile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('User Not Found')
                    .setDescription('This user does not have a DUB account.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            if (profile.banned.status) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Already Banned')
                    .setDescription('This user is already banned.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            profile.banned = {
                status: true,
                reason: reason,
                bannedBy: interaction.user.username,
                bannedAt: new Date()
            };
            
            await profile.save();
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('User Banned')
                .setDescription(`${targetUser.username} has been banned from DUB.`)
                .addFields(
                    { name: 'User', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: 'Banned By', value: interaction.user.username, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Ban command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to ban user. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};