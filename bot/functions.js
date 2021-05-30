const fs = require('fs');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { AudioConfig } = require("microsoft-cognitiveservices-speech-sdk");
require('dotenv').config()
const wavConverter = require('wav-converter');


const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.KEY, process.env.LOCATION);


const stt = (path) => {
    pcmToWav(path);
    const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(`${path}.wav`));
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(result => {
        recognizer.close();
        return(`RECOGNIZED: Text=${result.text}`);
    });
}

const pcmToWav = (path) => {
    const pcmData = fs.readFileSync(`${path}.pcm`);
    const wavData = wavConverter.encodeWav(pcmData, {
        numChannels: 2,
        sampleRate: 48000,
        byteRate: 16
    });
    fs.writeFileSync(`${path}.wav`, wavData);
}

module.exports = {
    stt
}