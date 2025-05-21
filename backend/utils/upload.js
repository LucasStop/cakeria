const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, os.tmpdir()); 
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: fileFilter,
});

const safeUpload = {
  single: function (fieldName) {
    return function (req, res, next) {
      try {
        const middleware = upload.single(fieldName);

        middleware(req, res, function (err) {
          if (err) {
            console.error('Erro no upload:', err);
            return res.status(400).json({
              error: 'Erro no upload de arquivo',
              details: err.message,
            });
          }
          next();
        });
      } catch (error) {
        console.error('Erro crítico no processamento de upload:', error);
        return res.status(500).json({
          error: 'Erro interno no processamento de arquivos',
          details: error.message,
        });
      }
    };
  },
  array: function (fieldName, maxCount) {
    return function (req, res, next) {
      try {
        const middleware = upload.array(fieldName, maxCount);

        middleware(req, res, function (err) {
          if (err) {
            console.error('Erro no upload múltiplo:', err);
            return res.status(400).json({
              error: 'Erro no upload de arquivos',
              details: err.message,
            });
          }
          next();
        });
      } catch (error) {
        console.error('Erro crítico no processamento de upload múltiplo:', error);
        return res.status(500).json({
          error: 'Erro interno no processamento de arquivos',
          details: error.message,
        });
      }
    };
  },
};

module.exports = safeUpload;
