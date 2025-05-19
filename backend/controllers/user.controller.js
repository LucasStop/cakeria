const { User, Address, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// User finding options without password
const userAttributes = {
  attributes: { exclude: ['password'] },
};

exports.findAll = async (req, res) => {
  try {
    const user = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Address, as: 'address' }],
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
    const { name, email, cpf, password, type, phone, address = {} } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Senha é obrigatória e deve ser uma string' });
    }

    let image = null;
    if (req.file) {
      image = req.file.buffer;
    }

    const result = await sequelize.transaction(async t => {
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = { name, email, cpf, password: hashedPassword, type, phone };
      if (image) userData.image = image;

      const user = await User.create(userData, { transaction: t });

      if (Array.isArray(address) && address.length > 0) {
        for (const addr of address) {
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

      return user;
    });

    const userWithAddress = await User.findByPk(result.id, {
      ...userAttributes,
      include: [{ model: Address, as: 'address' }],
    });

    res.status(201).json(userWithAddress);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao criar usuário',
      error: error.message,
      type: error.name,
      stack: error.stack,
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const { address = {}, currentPassword, password, ...userData } = req.body;

    let image = null;
    if (req.file) {
      image = req.file.buffer;
    }

    await sequelize.transaction(async t => {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (password) {
        if (!currentPassword) {
          return res.status(400).json({
            message: 'A senha atual é obrigatória para alterar a senha',
          });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }

        userData.password = await bcrypt.hash(password, 10);
      }

      if (image) {
        userData.image = image;
      }

      await User.update(userData, { where: { id }, transaction: t });

      if (address) {
        if ((address.postal_code || address.cep) && (address.street || address.number)) {
          // Se o endereço tem um ID, atualiza o endereço existente
          if (address.id) {
            const addressExists = await Address.findOne({
              where: { id: address.id, user_id: id },
              transaction: t,
            });

            if (addressExists) {
              // Atualiza o endereço existente
              await Address.update(
                {
                  street: address.street || addressExists.street,
                  number: address.number || addressExists.number,
                  neighborhood: address.neighborhood || addressExists.neighborhood,
                  complement: address.complement || addressExists.complement,
                  city: address.city || addressExists.city,
                  state: address.state || address.uf || addressExists.state,
                  postal_code: address.postal_code || address.cep || addressExists.postal_code,
                  country: address.country || addressExists.country || 'Brasil',
                },
                { where: { id: address.id }, transaction: t }
              );
            }
          } else {
            await Address.create(
              {
                user_id: id,
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
        }
      }
    });

    const updatedUser = await User.findByPk(id, {
      ...userAttributes,
      include: [{ model: Address, as: 'address' }],
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.transaction(async t => {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      await Address.destroy({ where: { user_id: id }, transaction: t });

      await User.destroy({ where: { id }, transaction: t });
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover usuário', error: error.message });
  }
};

exports.getUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: ['image'] });
    if (!user || !user.image) {
      return res.status(404).send('Imagem não encontrada');
    }
    res.set('Content-Type', 'image/png');
    res.send(user.image);
  } catch (error) {
    res.status(500).send('Erro ao buscar imagem do usuário');
  }
};
