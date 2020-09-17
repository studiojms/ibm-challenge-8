const express = require('express');
const multer = require('multer');
const _ = require('lodash');

const multerConfig = require('./config/multer-config');
const core = require('./core');

const app = express();
const upload = multer(multerConfig);

app.get('/', (req, res) => {
  return res.json({ status: 'running' });
});

app.post('/api/recommend', upload.single('audio'), async (req, res) => {
  try {
    console.log('>>>>>>>>>>>>>>>>>>');
    console.log('requisicao recebida');
    console.log('total keys', Object.keys(req.body));
    console.log(JSON.stringify(req.body));
    console.log('<<<<<<<<<<<<<<<<<<');

    const car = req.body.car;
    let text;
    let audio;
    const response = {
      entities: [],
      recommendation: '',
    };

    if (!req.body.car) {
      console.log('------------------');
      console.log('CARRO NAO INFORMADO');
      console.log('response', {
        recommendation: response.recommendation,
        entities: response.entities,
      });
      console.log('------------------');
      return res.json({
        recommendation: response.recommendation,
        entities: response.entities,
      });
    }

    if (req.body.text) {
      text = req.body.text;
    }

    if (req.file && req.file.path) {
      audio = req.file.path;
    }

    if (!text && !audio) {
      console.log('------------------');
      console.log('TEXT E AUDIO NAO INFORMADOS');
      console.log('response', {
        recommendation: response.recommendation,
        entities: response.entities,
      });
      console.log('------------------');

      return res.json({
        recommendation: response.recommendation,
        entities: response.entities,
      });
    }

    core
      .process(audio, text)
      .then((val) => {
        response.entities = val && val.result ? val.result.entities : [];

        const possiveisModelos = [
          'TORO',
          'DUCATO',
          'FIORINO',
          'CRONOS',
          'FIAT 500',
          'MAREA',
          'LINEA',
          'ARGO',
          'RENEGADE',
        ];

        let modeloEncontrado = response.recommendation;

        const modelos = response.entities.filter((entity) => entity.type == 'MODELO');
        if (modelos && modelos.length > 0) {
          const sortedModelos = _.sortBy(modelos, ['sentiment.score', 'confidence']);
          const result = sortedModelos
            .map((m) => m.text)
            .filter(
              (modelo) =>
                !modelo.toLowerCase().includes(car.toLowerCase()) && !car.toLowerCase().includes(modelo.toLowerCase())
            );

          modeloEncontrado = possiveisModelos.filter((m) =>
            _.first(result) ? _.first(result).toUpperCase().includes(m) : false
          );

          modeloEncontrado = _.isEmpty(modeloEncontrado)
            ? ''
            : _.isArray(modeloEncontrado)
            ? _.first(modeloEncontrado)
            : modeloEncontrado;

          console.log('>>>>>>>>>>>>>>', modeloEncontrado);
        }

        response.entities = response.entities
          .filter((entity) => entity.type != 'MODELO')
          .map((entity) => {
            return {
              entity: entity.type,
              mention: entity.text,
              sentiment: entity.sentiment.score,
            };
          });

        console.log('------------------');
        console.log('PROCESO OK');
        console.log('response', {
          recommendation: modeloEncontrado,
          entities: response.entities,
        });
        console.log('------------------');

        return res.json({
          recommendation: modeloEncontrado,
          entities: response.entities,
        });
      })
      .catch((err) => {
        console.error(err);

        console.log('------------------');
        console.log('ERRO', err);
        console.log('response', {
          recommendation: response.recommendation,
          entities: response.entities,
        });
        console.log('------------------');

        return res.json({
          recommendation: response.recommendation,
          entities: response.entities,
        });
      });
  } catch (err) {
    console.error(err);

    console.log('------------------');
    console.log('ERRO GERAL', err);
    console.log('response', {
      recommendation: '',
      entities: [],
    });
    console.log('------------------');

    return res.json({
      recommendation: '',
      entities: [],
    });
  }
});

module.exports = {
  app,
};
