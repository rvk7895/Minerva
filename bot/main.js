const Discord = require('discord.js');
const client = new Discord.Client();
const { Readable } = require('stream');

const SILENCE_FRAME = Buffer.from([0xF8, 0xFF, 0xFE]);

class Silence extends Readable {
  _read() {
    this.push(SILENCE_FRAME);
    this.destroy();
  }
}


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', (msg) => {
    if (msg.content == 'ping')
        msg.reply('pong');
});

const token = 'ODQ3NzQyMzM2MzIyNTAyNjg3.YLCfkw.crAN79Vp5p687Hjnn1NGYRpO8Bo'

const fs = require('fs');
const util = require('util');

client.login(token);
client.on('message', async message => {
	// Join the same voice channel of the author of the message
	if (message.content === 'rec' && message.member.voice.channel) {
		const connection = await message.member.voice.channel.join();

        // Create a ReadableStream of s16le PCM audio
        const audio = connection.receiver.createStream(message.member, { 
            mode: 'pcm', 
            end: 'silence'
        });

        const writer = audio.pipe(fs.createWriteStream(`recorded-${message.author.id}.pcm`));
        writer.on('finish', () => {
            message.member.voice.channel.leave();
            console.log('Finished writing audio')
        });
	}
});

client.on('message', async message => {
	// Join the same voice channel of the author of the message
	if (message.content === 'play' && message.member.voice.channel) {
        
        if (!fs.existsSync(`recorded-${message.author.id}.pcm`)) return console.log('Record audio first');
        
		const connection = await message.member.voice.channel.join();
        const stream = fs.createReadStream(`recorded-${message.author.id}.pcm`);

        const dispatcher = connection.play(stream, {
            type: 'converted'
        });

        dispatcher.on('finish', () => {
            message.member.voice.channel.leave();
            return console.log('Finished playing audio')
        });
	}
});
