const Discord = require('discord.js');

const client = new Discord.Client();

const DEFAULT_TIMEOUT = 2;
const VOTING_TIME = 30;
const YES_EMOJI = '⬆';
const NO_EMOJI = '⬇';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('!m help', { type: 'LISTENING' });
});

client.on('message', message => {
    if (message.content.startsWith('!m ')) {
        const command = message.content.split('!m ')[1];
        const timeout = parseInt(message.content.split(' ')[3]) || DEFAULT_TIMEOUT;

        if (command === 'help') {
            help(message);
        } else if (command.startsWith('mute')) {
            changeVoiceStatus(message, command, timeout, {
                function: mute,
                messageContent: 'Should {{member}} get muted for {{timeout}} minutes?',
                noUserSpecifiedMessage: 'Please specify the user that should be muted!',
                notInSameChannelMessage: 'You have to be in the same Voice Channel as the member you want to mute!'
            });
        } else if (command.startsWith('unmute')) {
            changeVoiceStatus(message, command, timeout, {
                function: unmute,
                messageContent: 'Should {{member}} get unmuted?',
                noUserSpecifiedMessage: 'Please specify the user that should be unmuted!',
                notInSameChannelMessage: 'You have to be in the same Voice Channel as the member you want to unmute!'
            });
        } else if (command.startsWith('deafen')) {
            changeVoiceStatus(message, command, timeout, {
                function: deafen,
                messageContent: 'Should {{member}} get deafened for {{timeout}} minutes?',
                noUserSpecifiedMessage: 'Please specify the user that should be deafened!',
                notInSameChannelMessage: 'You have to be in the same Voice Channel as the member you want to deafen!'
            });
        } else if (command.startsWith('undeafen')) {
            changeVoiceStatus(message, command, timeout, {
                function: undeafen,
                messageContent: 'Should {{member}} get undeafened?',
                noUserSpecifiedMessage: 'Please specify the user that should be undeafened!',
                notInSameChannelMessage: 'You have to be in the same Voice Channel as the member you want to undeafen!'
            });
        }
    }
});

client.login(process.env['DISCORD_TOKEN']).catch(console.error);

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

async function changeVoiceStatus(message, command, timeout, action) {
    if (command.indexOf(' ') >= 0) {
        let userId = command.split(' ')[1];
        userId = userId.substring(3, userId.length - 1);

        try {
            const member = await message.guild.members.cache.get(userId);

            if (member) {
                if (
                    member.voice.channelID !== undefined
                    && member.voice.channelID === message.member.voice.channelID
                ) {
                    try {
                        const sentMessage = await message.channel
                            .send(action.messageContent
                                .replace('{{member}}', `<@!${member.id}>`)
                                .replace('{{timeout}}', timeout))
                            .catch(console.error);

                        sentMessage.react(YES_EMOJI)
                            .then(() => {
                                sentMessage.react(NO_EMOJI)
                                    .catch(console.error);
                            })
                            .catch(console.error);


                        const filter = (reaction, user) => {
                            return (reaction.emoji.name === YES_EMOJI
                                || reaction.emoji.name === NO_EMOJI)
                        }

                        sentMessage.awaitReactions(filter, { time: VOTING_TIME * 1000 })
                            .then(collected => {
                                let votesYes = collected.get(YES_EMOJI)
                                    ? collected.get(YES_EMOJI).users.cache.array()
                                        .filter(m => member.voice.channel.members.array().map(m => m.id).includes(m.id))
                                        .filter(m => m.id !== member.id)
                                        .length
                                    : 0;
                                let votesNo = collected.get(NO_EMOJI)
                                    ? collected.get(NO_EMOJI).users.cache.array()
                                        .filter(m => member.voice.channel.members.array().map(m => m.id).includes(m.id))
                                        .filter(m => m.id !== member.id)
                                        .length
                                    : 0;
                                let noOfMembersInChannel = member.voice.channel.members.array().length;

                                if (
                                    votesYes > votesNo
                                    && Math.max(votesYes, votesNo) > (noOfMembersInChannel - 1) / 2
                                ) {
                                    action.function(member, timeout);
                                }
                            })
                            .catch(console.error);
                    } catch (error) {
                        console.error(error);
                    }
                } else {
                    message.channel.send(action.notInSameChannelMessage)
                        .catch(console.error);
                }
            } else {
                message.channel.send('There is no member with that ID on this server!')
                    .catch(console.error);
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        message.channel.send(action.noUserSpecifiedMessage)
            .catch(console.error);
    }
}

function mute(member, timeout) {
    member.voice.setMute(true);

    setTimeout(() => {
        member.voice.setMute(false);
    }, timeout * 60 * 1000);
}

function unmute(member, _) {
    member.voice.setMute(false);
}

function deafen(member, timeout) {
    member.voice.setDeaf(true);
    member.voice.setMute(true);

    setTimeout(() => {
        member.voice.setDeaf(false);
        member.voice.setMute(false);
    }, timeout * 60 * 1000);
}

function undeafen(member, _) {
    member.voice.setDeaf(false);
}
