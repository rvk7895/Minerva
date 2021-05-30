const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const questions = [
  "Hello there , how are you?",
  "Okay, well I just felt like something didn't seem okay, so I am going to ask you a few questions. Think about your response and then answer it. The first question is In the past two weeks, how often have you felt down, depressed, or hopeless?",
  "How well can you sleep off lately?",
  "How is your energy levels through the day?",
  "This question deals with the topic of suicide, Have you had any thoughts of suicide?",
  "Do you prefer to stay at home rather than going out and doing new things?",
  "That was the end of the assesment, your results will be sent to you"
]

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function returnResponseObj(response, projectId = 'minerva-315113') {
  // A unique identifier for the given session
  const sessionId = uuid.v4();

  // Create a new session
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: "minerva-315113-e4b12fb64eff.json"
  });
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: response,
        // The language used by the client (en-US)
        languageCode: 'en-US',
      },
    },
  };

  // Send request and log result
  // const responses = await sessionClient.detectIntent(request);
  // console.log('Detected intent');
  // const result = responses[0].queryResult;
  // console.log(`  Query: ${result.queryText}`);
  // console.log(`  Response: ${result.fulfillmentText}`);
  // var val;
  // const response_str = result.fulfillmentText;
  // if (result.intent) {
  //   val += Number(String(result.intent.displayName).split('-')[1])
  // }
  // console.log(`  ${val}`);

  // return { 'val': val, 'str': response_str };
  return sessionClient.detectIntent(request);
}

module.exports = {
  questions,
  returnResponseObj,
}