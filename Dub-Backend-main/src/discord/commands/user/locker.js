const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../../models/Profile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('locker')
        .setDescription('View your locker items')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category to view')
                .setRequired(false)
                .addChoices(
                    { name: 'Outfits', value: 'outfits' },
                    { name: 'Pickaxes', value: 'pickaxes' },
                    { name: 'Gliders', value: 'gliders' },
                    { name: 'Backblings', value: 'backblings' },
                    { name: 'Emotes', value: 'emotes' },
                    { name: 'Wraps', value: 'wraps' }
                )),
    
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
            
            const category = interaction.options.getString('category');
            
            if (category) {
                const items = profile.locker[category];
                
                if (items.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle(`Your ${category.charAt(0).toUpperCase() + category.slice(1)}`)
                        .setDescription('You do not have any items in this category yet.')
                        .setTimestamp();
                    
                    return await interaction.editReply({ embeds: [embed] });
                }
                
                const itemList = items.slice(0, 25).map(item => `${item.name} (${item.rarity})`).join('\n');
                
                const embed = new EmbedBuilder()
                    .setColor(0x00BFFF)
                    .setTitle(`Your ${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length} total)`)
                    .setDescription(itemList)
                    .setFooter({ text: items.length > 25 ? 'Showing first 25 items' : '' })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                const totalItems = 
                    profile.locker.outfits.length +
                    profile.locker.pickaxes.length +
                    profile.locker.gliders.length +
                    profile.locker.backblings.length +
                    profile.locker.emotes.length +
                    profile.locker.wraps.length;
                
                const embed = new EmbedBuilder()
                    .setColor(0x00BFFF)
                    .setTitle('Your Locker')
                    .setDescription(`You have ${totalItems} total items in your locker.`)
                    .addFields(
                        { name: 'Outfits', value: `${profile.locker.outfits.length} items`, inline: true },
                        { name: 'Pickaxes', value: `${profile.locker.pickaxes.length} items`, inline: true },
                        { name: 'Gliders', value: `${profile.locker.gliders.length} items`, inline: true },
                        { name: 'Backblings', value: `${profile.locker.backblings.length} items`, inline: true },
                        { name: 'Emotes', value: `${profile.locker.emotes.length} items`, inline: true },
                        { name: 'Wraps', value: `${profile.locker.wraps.length} items`, inline: true }
                    )
                    .setFooter({ text: 'Use /locker category:<category> to view items in a specific category' })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Locker command error:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Failed to fetch locker. Please try again.')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};