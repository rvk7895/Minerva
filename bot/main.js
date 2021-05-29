const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const { tts, stt } = require('./functions');
const axios = require('axios');
const { request, gql, GraphQLClient } = require('graphql-request');

const database = {}

const gqlClient = new GraphQLClient('https://api-ap-northeast-1.graphcms.com/v2/ckp9xwhpbx9xy01xvf3r42llu/master', { headers: {} });

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

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', async message => {
    // Join the same voice channel of the author of the message
    if (message.author.bot) return;



    if (message.content === '~here') {
        let count = 1;
        conversation(count, message);
    }
    else {
        let depressionScore = 0;
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
            let messageCount = 0;
            // Check if user is in DB, else create user
            const checkQuery = gql`{
                    discordUser(where: {discordId: "${message.author.id}"}){
                        discordId,
                        messages{
                            id
                        }
                    }
                }`;

            try {
                let res = await gqlClient.request(checkQuery);
                // User doesn't exist. Create new user
                if (!res.discordUser) {
                    const createQuery = gql`
                        mutation{
                            createDiscordUser(data: {discordId: "${message.author.id}", userName: "${message.author.username}"}){
                                id
                            }
                        }`;
                    try {
                        res = await gqlClient.request(createQuery);
                        console.log(res);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
                else
                    messageCount = res.discordUser.messages.length;
            }
            catch (err) {
                console.log(err);
            }

            const addMessageQuery = gql`
                    mutation{
                        createMessage(data:{
                            content:"${message.content}",
                            depressionScore: ${depressionScore},
                            author:{connect:{discordId:"${message.author.id}"}}
                        }){
                            id
                        }
                    }`;

            try {
                res = await gqlClient.request(addMessageQuery);
                if (res)
                    messageCount++;
            }
            catch (err) {
                console.log(err);
            }

            if (messageCount > 2) {
                message.reply("Come talk to me in any VC, send `~here` when you are in a VC")
            } else {
                message.reply("We are here for you");
            }

        }
    }
});

const token = 'ODQ3NzQyMzM2MzIyNTAyNjg3.YLCfkw.crAN79Vp5p687Hjnn1NGYRpO8Bo'

client.login(token);