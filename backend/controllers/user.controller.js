const { User, Address, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// User finding options without password
const userAttributes = { 
  attributes: { exclude: ['password'] }
};

exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll(userAttributes);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      ...userAttributes,
      include: [{ model: Address, as: 'addresses' }],
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, type, phone, address = {} } = req.body;
    
    // Utiliza transação para garantir consistência
    const result = await sequelize.transaction(async (t) => {
      // Criptografa a senha
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Cria o usuário
      const user = await User.create(
        { name, email, password: hashedPassword, type, phone }, 
        { transaction: t }
      );

      // Cria o endereço se fornecido
      if (address.postal_code) {
        await Address.create({
          user_id: user.id,
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          complement: address.complement,
          city: address.city,
          state: address.state || address.uf,
          postal_code: address.postal_code || address.cep,
          country: address.country || 'Brasil'
        }, { transaction: t });
      }

      return user;
    });

    // Busca o usuário com endereço
    const userWithAddress = await User.findByPk(result.id, {
      ...userAttributes,
      include: [{ model: Address, as: 'addresses' }],
    });

    res.status(201).json(userWithAddress);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar usuário', error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    // Criptografa a senha se fornecida
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    
    const [updated] = await User.update(req.body, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = await User.findByPk(id, userAttributes);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover usuário', error: error.message });
  }
};