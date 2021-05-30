const googleapis = require('googleapis');

require('dotenv').config();

// Some supported attributes
// attributes = ["TOXICITY", "SEVERE_TOXICITY", "IDENTITY_ATTACK", "INSULT",
// "PROFANITY", "THREAT", "SEXUALLY_EXPLICIT", "FLIRTATION", "SPAM",
// "ATTACK_ON_AUTHOR", "ATTACK_ON_COMMENTER", "INCOHERENT",
// "INFLAMMATORY", "OBSCENE", "SPAM", "UNSUBSTANTIAL"];

// Set your own thresholds for when to trigger a response
const attributeThresholds = {
  'INSULT': 0.85,
  'TOXICITY': 0.85,
  'SPAM': 0.9,
  'INCOHERENT': 0.8,
  'FLIRTATION': 0.8,
};

/**
 * Analyze attributes in a block of text
 * @param {string} text - text to analyze
 * @return {json} res - analyzed atttributes
 */
async function analyzeText(text) {
  const analyzer = new googleapis.commentanalyzer_v1alpha1.Commentanalyzer();

  // This is the format the API expects
  const requestedAttributes = {};
  for (const key in attributeThresholds) {
    requestedAttributes[key] = {};
  }

  const req = {
    comment: {text: text},
    languages: ['en'],
    requestedAttributes: requestedAttributes,
  };

  const res = await analyzer.comments.analyze({
    key: process.env.PERSPECTIVE_API_KEY,
    resource: req},
  );

  data = {};

  for (const key in res['data']['attributeScores']) {
    data[key] =
        res['data']['attributeScores'][key]['summaryScore']['value'] >
        attributeThresholds[key];
  }
  return data;
}

module.exports.analyzeText = analyzeText;
