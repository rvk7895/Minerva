const fs = require('fs');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { SpeechSynthesizer, AudioConfig, SpeechRecognizer, PullAudioInputStreamCallback } = require("microsoft-cognitiveservices-speech-sdk");
require('dotenv').config()
const wavConverter = require('wav-converter');

const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.KEY, process.env.LOCATION);

const tts = (path,text) => {
    const audioConfig = AudioConfig.fromAudioFileOutput(`${path}-converted2.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
        text,
        result => {
            synthesizer.close();
            if (result) {
                fs.createReadStream(`${path}-converted2.wav`);
                wavToPcm(path);
            }
        },
        error => {
            console.log(error);
            synthesizer.close();
        }
    )
}

const stt = (path) => {
    pcmToWav(path);
    const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(`${path}-converted1.wav`));
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(result => {
        console.log(`RECOGNIZED: Text=${result.text}`);
        recognizer.close();
    });
}

const pcmToWav = (path) => {
    const pcmData = fs.readFileSync(`${path}.pcm`);
    const wavData = wavConverter.encodeWav(pcmData, {
        numChannels: 2,
        sampleRate: 48000,
        byteRate: 16
    });
    fs.writeFileSync(`${path}-converted1.wav`, wavData);
}

const wavToPcm = (path) => {
    const wavData = fs.readFileSync(`${path}-converted2.wav`);
    const pcmData = wavConverter.decodeWav(wavData);
    fs.writeFileSync(`${path}-converted3.pcm`,pcmData);
}


module.exports = {
    tts,
    stt,
    wavToPcm,
}