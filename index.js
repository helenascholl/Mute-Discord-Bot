const Discord = require('discord.js');

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('!m help', { type: 'LISTENING' });
});

client.on('message', message => {
    if (message.content.startsWith('!m')) {
        const command = message.content.split('!m ')[1];

        switch (command) {
            case 'help':
                help(message);
                break;
        }
    }
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);

function help(message) {
    const help = '`!m mute @Member:` Vote to mute a member\n'
        + '`!m deafen @Member:` Vote to deafen a member\n'
        + '`!m unmute @Member:` Vote to unmute a member\n'
        + '`!m undeafen @Member:` Vote to undeafen a member';

    const embed = new Discord.MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Mute-Bot')
    .setURL('https://github.com/schollsebastian/Mute-Discord-Bot')
    .addField('Help', help);

    message.channel.send(embed).catch(console.error);
}