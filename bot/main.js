const fs = require('fs');
const util = require('util');
const Discord = require('discord.js');
const axios = require('axios');
const { gql, GraphQLClient } = require('graphql-request');
const textToSpeech = require('@google-cloud/text-to-speech');
const { stt } = require('./functions');
const { evaluateMessage, getKarma } = require('./moderator');

const { questions, returnResponseObj } = require('./dialogflow');
const { ConsoleLoggingListener } = require('microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common.browser/ConsoleLoggingListener');

const client = new Discord.Client();
const gttsClient = new textToSpeech.TextToSpeechClient({ keyFilename: './gtts_cred.json' });
const gqlClient = new GraphQLClient('https://api-ap-northeast-1.graphcms.com/v2/ckp9xwhpbx9xy01xvf3r42llu/master', { headers: {} });
let users = {}

const conversation = async (count, message) => {
    if (count >= 7) {
        // Handle score
        message.member.voice.channel.leave();
    }

    const connect = await message.member.voice.channel.join();
    let filename = `./audio_files/recorded-${message.author.id}-${Date.now()}`;

    const text = questions[count];
    const request = {
        input: { text: text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await gttsClient.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`${filename}-tts.mp3`, response.audioContent, 'binary');

    const dispatcher = connect.play(`${filename}-tts.mp3`);
    dispatcher.on('finish', async () => {
        const audio = connect.receiver.createStream(message.member, { mode: 'pcm' });
        const writer = audio.pipe(fs.createWriteStream(`${filename}.pcm`));

        writer.on('finish', async () => {
            const transcript = await stt(filename);
            console.log(transcript);

            const responses = await returnResponseObj(transcript);
            const result = responses[0].queryResult;
            let val = 0;
            const response_str = result.fulfillmentText;

            if (result.intent)
                val += Number(String(result.intent.displayName).split('-')[1]) || 0;

            console.log(`  ${val}`);

            const responseObj = { 'val': val, 'str': response_str };

            const DFtext = responseObj.str;
            const DFrequest = {
                input: { text: DFtext },
                voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
                audioConfig: { audioEncoding: 'MP3' },
            };

            const [DFresponse] = await gttsClient.synthesizeSpeech(DFrequest);
            const writeFile = util.promisify(fs.writeFile);
            await writeFile(`${filename}-DFtts.mp3`, DFresponse.audioContent, 'binary');

            const DFdispatcher = connect.play(`${filename}-DFtts.mp3`);
            DFdispatcher.on('finish', () => {
                conversation(count + 1, message);
            })
        });

    });

}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', async message => {
    // Join the same voice channel of the author of the message
    if (message.author.bot) return;
    let userid = message.author.id;

    if (!users[userid]) {
        users[userid] = [];
    }

    await evaluateMessage(message, users);

    if (message.content.startsWith('~karma')) {
        const karma = getKarma(users);
        message.channel.send(karma ? karma : 'No karma yet!');
    }

    if (message.content === '~here') {
        let count = 0;
        conversation(count, message);
        console.log("Convo done");
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