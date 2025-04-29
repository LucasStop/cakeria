const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/auth');

// Autentica usuário e retorna token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Valida os dados de entrada
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios',
      });
    }

    // Procura usuário pelo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: 'Credenciais inválidas',
      });
    }

    // Compara a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciais inválidas',
      });
    }

    // Atualiza o último login
    await updateLastLogin(user.id);

    // Gera o token JWT
    const token = generateToken(user);

    // Retorna os dados do usuário e o token (excluindo senha)
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
