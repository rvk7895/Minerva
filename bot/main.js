const Discord = require('discord.js');
const client = new Discord.Client();
const { Readable } = require('stream');
const fs = require('fs');
const util = require('util');
const { tts, stt } = require('./functions');
const { spawn } = require('child_process');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', (msg) => {
    if (msg.content == 'ping')
        msg.reply('pong');
});

const token = 'ODQ3NzQyMzM2MzIyNTAyNjg3.YLCfkw.crAN79Vp5p687Hjnn1NGYRpO8Bo'

client.login(token);

const conversation = async (count, message) => {
    const connect = await message.member.voice.channel.join();

    // Create a ReadableStream of s16le PCM audio
    const audio = connect.receiver.createStream(message.member, {
        mode: 'pcm',
    });

    let filename = `./audio_files/recorded-${message.author.id}-${Date.now()}`;
    const writer = audio.pipe(fs.createWriteStream(`${filename}.pcm`));

    writer.on('finish', () => {
        stt(filename);
        // api call
        tts(filename);
        const stream = fs.createReadStream(`${filename}.pcm`);

        const dispatcher = connect.play(stream, {
            type: 'converted'
        });
        console.log('Finished writing audio')
        dispatcher.on('finish', () => {
            count += 1;
            if (count < 5)
                conversation(count, message)
            return console.log('Finished playing audio')
        });
    });
}

client.on('message', async message => {
    // Join the same voice channel of the author of the message
    if (message.member.voice.channel) {
        let count = 0;
        conversation(count, message);
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
