const express = require('express');
const multer = require('multer');
const _ = require('lodash');

const multerConfig = require('./config/multer-config');
const core = require('./core');

const app = express();
const upload = multer(multerConfig);

app.post('/api/recommend', upload.single('audio'), (req, res) => {
  const car = req.body.car;
  let text;
  let audio;
  const response = {
    entities: [],
    recommendation: '',
  };

  if (!req.body.car) {
    res.json({
      err: 'Parâmetro "car" não informado.',
    });
  }

  if (req.body.text) {
    text = req.body.text;
  }

  if (req.file && req.file.path) {
    audio = req.file.path;
  }

  if (!text && !audio) {
    res.json({
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

      res.json({
        recommendation: modeloEncontrado,
        entities: response.entities,
      });
    })
    .catch((err) => {
      console.error(err);
      res.json({
        recommendation: response.recommendation,
        entities: response.entities,
      });
    });
});

module.exports = {
  app,
};
