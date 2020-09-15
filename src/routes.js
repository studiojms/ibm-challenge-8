const fs = require('fs');
const express = require('express');
const multer = require('multer');

const multerConfig = require('./config/multer-config');
const core = require('./core');

const app = express();
const upload = multer(multerConfig);

app.post('/api/recommend', upload.single('audio'), (req, res) => {
  console.log(req.body);
  if (!req.body.car) {
    return res.json({
      err: 'Parâmetro "car" não informado.',
    });
  }

  const car = req.body.car;
  let text;
  let audio;

  const response = {
    entities: [],
    recommendation: '',
  };

  if (req.body.text) {
    text = req.body.text;
  }

  core
    .process(req.file.path, text)
    .then((val) => {
      console.log('===========result');
      console.log(val.result);
      response.entities = val.result.entities;

      res.json({
        recommendation: response.recommendation,
        entities: response.entities,
      });
    })
    .catch((err) => {
      console.error(err);
    });
});

// if (req.file) {
//   try {
//     const audioFile = fs.readFileSync(req.file.path);

//     audio = audioFile;

//     const result = core.process(req.file.path);
//     console.log('===========result');
//     console.log(result);

//     res.json({
//       recommendation: response.recommendation,
//       entities: response.entities,
//     });
//   } catch (err) {
//     console.error('err', err);

//     return res.json({ err });
//   } finally {
//     try {
//       fs.unlinkSync(req.file.path);
//     } catch {
//       console.error('Remoção do arquivo com erros.');
//     }
//   }
// } else {
//   core
//     .process(null, text)
//     .then((val) => {
//       console.log('===========result');
//       console.log(val.result.entities);
//       response.entities = val.result.entities;

//       res.json({
//         recommendation: response.recommendation,
//         entities: response.entities,
//       });
//     })
//     .catch((err) => {
//       console.error(err);
//     });
// }
// });

module.exports = {
  app,
};
