const fs = require('fs');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { SpeechSynthesizer, AudioConfig, SpeechRecognizer } = require("microsoft-cognitiveservices-speech-sdk");
require('dotenv').config()
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.KEY, process.env.LOCATION);

const tts = (text) => {
    const audioConfig = AudioConfig.fromAudioFileOutput('./testing_files/tts.wav');
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
        text,
        result => {
            synthesizer.close();
            if (result) {
                return fs.createReadStream("./testing_files/tts.wav");
            }
        },
        error => {
            console.log(error);
            synthesizer.close();
        }
    )
}

const stt = (path) => {
    const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(path));
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    recognizer.recognizeOnceAsync(result => {
        console.log(`RECOGNIZED: Text=${result.text}`);
        recognizer.close();
    });
}

module.exports = {
    tts,
    stt,
}