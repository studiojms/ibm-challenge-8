const fs = require('fs');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const STS_APIKEY = process.env.STS_APIKEY || '';
const STS_URL = process.env.STS_URL || '';
const NLU_APIKEY = process.env.NLU_APIKEY || '';
const NLU_URL = process.env.NLU_URL || '';
const NLU_MODEL_ID = process.env.NLU_MODEL_ID || '';

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: STS_APIKEY,
  }),
  serviceUrl: STS_URL,
});

function doProcess(file, text) {
  if (file) {
    const recognizeParams = {
      audio: fs.createReadStream(file),
      contentType: 'audio/flac',
      model: 'pt-BR_BroadbandModel',
      //model: 'pt-BR_NarrowbandModel',
      wordAlternativesThreshold: 0.9,
      //keywords: ['colorado', 'tornado', 'tornadoes'],
      //keywordsThreshold: 0.5,
    };

    return speechToText
      .recognize(recognizeParams)
      .then((speechRecognitionResults) => {
        console.log(JSON.stringify(speechRecognitionResults, null, 2));

        const transcripts = speechRecognitionResults.result.results
          .filter((r) => r.final)
          .map((r) => r.alternatives.map((alternative) => alternative.transcript));

        return processNLU(transcripts.join(', '));
      })
      .catch((err) => {
        console.error('error:', err);
      });
  } else {
    return processNLU(text);
  }
}

function processNLU(text) {
  const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: '2020-08-01',
    authenticator: new IamAuthenticator({
      apikey: NLU_APIKEY,
    }),
    serviceUrl: NLU_URL,
  });

  const analyzeParams = {
    text: JSON.stringify(text),
    language: 'pt-BR',
    features: {
      entities: {
        sentiment: true,
        limit: 2,
        model: NLU_MODEL_ID,
      },
    },
  };

  return naturalLanguageUnderstanding
    .analyze(analyzeParams)
    .then((analysisResults) => {
      console.log('analysisResults', analysisResults);
      return analysisResults;
    })
    .catch((err) => {
      console.error('error:', err);
    });
}

module.exports = {
  process: doProcess,
};
