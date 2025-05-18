'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criando diretório para upload se não existir
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

// Exporta o middleware configurado
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  }
});

// Adicionar propriedade location para simular o comportamento do S3
upload.single = function(fieldName) {
  const middleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  }).single(fieldName);
  
  return function(req, res, next) {
    middleware(req, res, function(err) {
      if (req.file) {
        // Adicionar URL de acesso à imagem
        req.file.location = `/uploads/${req.file.filename}`;
      }
      next(err);
    });
  };
};

module.exports = upload;
