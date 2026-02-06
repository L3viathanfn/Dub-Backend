const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../../config/config');
const Profile = require('../../../models/Profile');
const Transaction = require('../../../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Create a new DUB account')
        .addStringOption(option =>
            option.setName('email')
                .setDescription('Your email address')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Your password (minimum 8 characters)')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const email = interaction.options.getString('email');
            const password = interaction.options.getString('password');
            const discordId = interaction.user.id;
            const username = interaction.user.username;
            
            if (password.length < 8) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Registration Failed')
                    .setDescription('Password must be at least 8 characters long')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const existingProfile = await Profile.findOne({
                $or: [{ email }, { discordId }]
            });
            
            if (existingProfile) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Registration Failed')
                    .setDescription(existingProfile.email === email 
                        ? 'This email is already registered' 
                        : 'Your Discord account is already registered')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
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
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Registration Successful')
                .setDescription(`Welcome to DUB, ${username}!`)
                .addFields(
                    { name: 'Starting Vbucks', value: `${config.defaults.vbucks} vbucks`, inline: true },
                    { name: 'Starter Skin', value: config.defaults.starterSkin.name, inline: true },
                    { name: 'Battle Pass', value: 'Free (Already Owned)', inline: true },
                    { name: 'Email', value: email, inline: false }
                )
                .setFooter({ text: 'Use /profile to view your account details' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Register command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Registration Failed')
                .setDescription('An error occurred during registration. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};