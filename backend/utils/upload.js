const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de uploads existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar armazenamento para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Criar um nome de arquivo único usando timestamp e nome original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

// Criar middleware do multer com tratamento de erro
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: fileFilter,
});

// Envolver o middleware do multer em um wrapper que captura erros
const safeUpload = {
  single: function (fieldName) {
    return function (req, res, next) {
      // Usar o middleware do multer em um try-catch
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
