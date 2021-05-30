const perspective = require('./perspective.js');

const emojiMap = {
    'FLIRTATION': '💋',
    'TOXICITY': '🧨',
    'INSULT': '👊',
    'SPAM': '🐟',
};

async function evaluateMessage(message, users) {
    let scores;
    try {
      scores = await perspective.analyzeText(message.content);
    } catch (err) {
      console.log(err);
      return false;
    }
  
    const userid = message.author.id;
  
    for (const attribute in emojiMap) {
      if (scores[attribute]) {
        message.react(emojiMap[attribute]);
        users[userid][attribute] =
                  users[userid][attribute] ?
                  users[userid][attribute] + 1 : 1;
      }
    }

}

function getKarma(users) {
    const scores = [];
    for (const user in users) {
      if (!Object.keys(users[user]).length) continue;
      let score = `<@${user}> - `;
      for (const attr in users[user]) {
        score += `${emojiMap[attr]} : ${users[user][attr]}\t`;
      }
      scores.push(score);
    }
    console.log(scores);
    if (!scores.length) {
      return '';
    }
    return scores.join('\n');
}

module.exports = {
    evaluateMessage,
    getKarma
}