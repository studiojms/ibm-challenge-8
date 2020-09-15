const fs = require('fs');
const express = require('express');
const multer = require('multer');

const multerConfig = require('./config/multer-config');

const app = express();
const upload = multer(multerConfig);

app.post('/api/recommend', upload.single('audio'), (req, res) => {
  console.log(req.body);
  if (!req.body.car) {
    return res.json({
      err: 'Parâmetro "car" não informado.',
    });
  }

  if (req.body.text) {
    console.log('Texto recebido: ' + req.body.text);
  }

  if (req.file) {
    console.log('tem audio');
    try {
      const audioFile = fs.readFileSync(req.file.path);

      return res.json({ audioFile });
    } catch (err) {
      console.error('err', err);

      return res.json({ err });
    } finally {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        console.error('Remoção do arquivo com erros.');
      }
    }
  }

  res.json({
    recommendation: '',
    entities: [],
  });
});

module.exports = {
  app,
};
