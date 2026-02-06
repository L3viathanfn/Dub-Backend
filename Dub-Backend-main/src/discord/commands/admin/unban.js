const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../../models/Profile');
const config = require('../../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from DUB')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unban')
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
            
            if (!profile.banned.status) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Not Banned')
                    .setDescription('This user is not currently banned.')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            profile.banned = {
                status: false,
                reason: '',
                bannedBy: '',
                bannedAt: null
            };
            
            await profile.save();
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('User Unbanned')
                .setDescription(`${targetUser.username} has been unbanned from DUB.`)
                .addFields(
                    { name: 'User', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: 'Unbanned By', value: interaction.user.username, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Unban command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to unban user. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};