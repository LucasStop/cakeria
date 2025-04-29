const { verifyToken } = require('../utils/auth');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    // Verifica se o formato do header está correto (Bearer [token])
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Adiciona informações do usuário à requisição
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Falha na autenticação', error: error.message });
  }
};
