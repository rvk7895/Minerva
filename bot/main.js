const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const { tts, stt, wavToPcm } = require('./functions');
const axios = require('axios');

const database = {}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
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
        //text = api call to dialog flow or whatever
        tts(filename, "Hello There");
        const stream = fs.createReadStream(`${filename}-converted2.wav`);

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
    if (message.author.bot) return;
    // console.log(message.author.id);
    let depressionScore
    try {
        const response = await axios.post('http://127.0.0.1:5000/', {
            text: message.content
        })
        depressionScore = Number(response.data);
    } catch (err) {
        console.log(err)
    }

    if (depressionScore < 0.5) return;
    else {
        console.log(depressionScore);
        if (message.author.id in database) {
            database[message.author.id] += 1
        } else {
            database[message.author.id] = 1
        }

        if (database[message.author.id] > 2) {
            let count = 1;
            message.reply("Come talk to me in any VC, send ~here when you are in a VC")
        } else {
            message.reply("We are here for you");
        }

    }
});

client.on('message', message => {
    if (message.author.bot) return;

    if (message.content === '~here') {
        let count = 1;
        conversation(count, message);
    }
})
