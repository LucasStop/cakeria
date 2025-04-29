const jwt = require('jsonwebtoken');

// Chave secreta para assinar o token
const JWT_SECRET = process.env.JWT_SECRET || 'cakeria-super-secret-key';
// Tempo de expiração do token
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '2h';

// Função para gerar um token
exports.generateToken = user => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

// Função para verificar um token
exports.verifyToken = token => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
