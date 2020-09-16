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
    .process(req.file ? req.file.path : null, text)
    .then((val) => {
      console.log('===========result');
      console.log('val', val);
      console.log('val.result', val.result);
      response.entities = val.result.entities;

      const modelos = val.result.entities.filter((entity) => entity.type == 'MODELO');

      if (modelos && modelos.length > 0) {
        const sortedModelos = _.sortBy(modelos, ['sentiment.score', 'confidence']);
        const result = sortedModelos.map((m) => m.text).filter((modelo) => modelo.toLowerCase() != car.toLowerCase());

        response.recommendation = _.first(result);
      }

      res.json({
        recommendation: response.recommendation,
        entities: response.entities,
      });
    })
    .catch((err) => {
      console.error(err);
    });
});

module.exports = {
  app,
};
