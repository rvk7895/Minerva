const fs = require('fs');
const wavConverter = require('wav-converter');

const test = path => {
    const pcmData = fs.readFileSync(`${path}.pcm`);
    const wavData = wavConverter.encodeWav(pcmData, {
        numChannels: 2,
        sampleRate: 48000,
        byteRate: 16
    });
    fs.writeFileSync(`${path}.wav`, wavData);
}

test('./audio_files/recorded-429572531951763457-1622277953502');