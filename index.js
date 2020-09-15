const fs = require('fs');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const STS_APIKEY = process.env.STS_APIKEY || '';
const STS_URL = process.env.STS_URL || '';
const NLU_APIKEY = process.env.NLU_APIKEY || '';
const NLU_URL = process.env.NLU_URL || '';

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: STS_APIKEY,
  }),
  serviceUrl: STS_URL,
});

const recognizeParams = {
  audio: fs.createReadStream('audio_sample.flac'),
  contentType: 'audio/flac',
  model: 'pt-BR_BroadbandModel',
  //model: 'pt-BR_NarrowbandModel',
  wordAlternativesThreshold: 0.9,
  //keywords: ['colorado', 'tornado', 'tornadoes'],
  //keywordsThreshold: 0.5,
};

speechToText
  .recognize(recognizeParams)
  .then((speechRecognitionResults) => {
    console.log(JSON.stringify(speechRecognitionResults, null, 2));

    const transcripts = speechRecognitionResults.result.results
      .filter((r) => r.final)
      .map((r) => r.alternatives.map((alternative) => alternative.transcript));

    transcripts.map((t) => console.log(t));
    transcripts.map((t) => processNLU(t));
  })
  .catch((err) => {
    console.log('error:', err);
  });

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
      },
    },
  };

  naturalLanguageUnderstanding
    .analyze(analyzeParams)
    .then((analysisResults) => {
      console.log(JSON.stringify(analysisResults, null, 2));
    })
    .catch((err) => {
      console.log('error:', err);
    });
}
