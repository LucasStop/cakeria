const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: 'Credenciais inválidas',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciais inválidas',
      });
    }

    await updateLastLogin(user.id);

    const token = generateToken(user);

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      user: userData,
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro durante login',
      error: error.message,
    });
  }
};

exports.refresh = async (req, res) => {
  try {
  
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token não fornecido',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
 
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        message: 'Token inválido ou expirado',
      });
    }
    

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: 'Usuário não encontrado',
      });
    }
    

    const newToken = generateToken(user);
    

    await updateLastLogin(user.id);
    
    // Retornar o novo token
    res.json({
      token: newToken,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao renovar token',
      error: error.message,
    });
  }
};

async function updateLastLogin(userId) {
  try {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ last_login: new Date() });
      console.log('Último login atualizado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao atualizar último login:', error);
  }
}
