const { User, Address, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// User finding options without password
const userAttributes = {
  attributes: { exclude: ['password'] },
};

exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
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
    const { name, email, password, type, phone, address = {}, addresses = [] } = req.body;

    // Utiliza transação para garantir consistência
    const result = await sequelize.transaction(async t => {
      // Criptografa a senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cria o usuário
      const user = await User.create(
        { name, email, password: hashedPassword, type, phone },
        { transaction: t }
      );

      // Processa múltiplos endereços se fornecidos
      if (Array.isArray(addresses) && addresses.length > 0) {
        for (const addr of addresses) {
          if ((addr.postal_code || addr.cep) && (addr.street || addr.number)) {
            await Address.create(
              {
                user_id: user.id,
                street: addr.street || '',
                number: addr.number || '',
                neighborhood: addr.neighborhood || '',
                complement: addr.complement || '',
                city: addr.city || '',
                state: addr.state || addr.uf || '',
                postal_code: addr.postal_code || addr.cep,
                country: addr.country || 'Brasil',
              },
              { transaction: t }
            );
          }
        }
      }
      // Mantém a compatibilidade com o formato antigo (single address)
      else if (
        address &&
        (address.postal_code || address.cep) &&
        (address.street || address.number)
      ) {
        await Address.create(
          {
            user_id: user.id,
            street: address.street || '',
            number: address.number || '',
            neighborhood: address.neighborhood || '',
            complement: address.complement || '',
            city: address.city || '',
            state: address.state || address.uf || '',
            postal_code: address.postal_code || address.cep,
            country: address.country || 'Brasil',
          },
          { transaction: t }
        );
      }

      return user;
    });

    // Busca o usuário com endereços
    const userWithAddresses = await User.findByPk(result.id, {
      ...userAttributes,
      include: [{ model: Address, as: 'addresses' }],
    });

    res.status(201).json(userWithAddresses);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar usuário', error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    // Criptografa a senha se estiver sendo atualizada
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const [updated] = await User.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
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
