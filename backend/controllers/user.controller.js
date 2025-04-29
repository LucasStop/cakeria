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
    const { address = {}, addresses = [], currentPassword, password, ...userData } = req.body;

    // Utiliza transação para garantir consistência
    await sequelize.transaction(async t => {
      // Verifica se o usuário existe
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Se estiver alterando a senha, verifica a senha atual
      if (password) {
        // Verifica se a senha atual foi fornecida
        if (!currentPassword) {
          return res.status(400).json({ 
            message: 'A senha atual é obrigatória para alterar a senha' 
          });
        }

        // Verifica se a senha atual está correta
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }

        // Criptografa a nova senha
        userData.password = await bcrypt.hash(password, 10);
      }

      // Atualiza os dados do usuário
      await User.update(userData, { where: { id }, transaction: t });

      // Processa múltiplos endereços se fornecidos
      if (Array.isArray(addresses) && addresses.length > 0) {
        for (const addr of addresses) {
          if ((addr.postal_code || addr.cep) && (addr.street || addr.number)) {
            // Se o endereço tem um ID, atualiza o endereço existente
            if (addr.id) {
              const addressExists = await Address.findOne({ 
                where: { id: addr.id, user_id: id },
                transaction: t
              });
              
              if (addressExists) {
                // Atualiza o endereço existente
                await Address.update(
                  {
                    street: addr.street || addressExists.street,
                    number: addr.number || addressExists.number,
                    neighborhood: addr.neighborhood || addressExists.neighborhood,
                    complement: addr.complement || addressExists.complement,
                    city: addr.city || addressExists.city,
                    state: addr.state || addr.uf || addressExists.state,
                    postal_code: addr.postal_code || addr.cep || addressExists.postal_code,
                    country: addr.country || addressExists.country || 'Brasil',
                  },
                  { where: { id: addr.id }, transaction: t }
                );
              }
            } else {
              // Cria um novo endereço se não tiver ID
              await Address.create(
                {
                  user_id: id,
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
      }
      // Mantém a compatibilidade com o formato antigo (single address)
      else if (
        address &&
        (address.postal_code || address.cep) &&
        (address.street || address.number)
      ) {
        // Se o endereço tem um ID, atualiza o endereço existente
        if (address.id) {
          const addressExists = await Address.findOne({ 
            where: { id: address.id, user_id: id },
            transaction: t
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
          // Cria um novo endereço se não tiver ID
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
    });

    // Busca o usuário atualizado com endereços
    const updatedUser = await User.findByPk(id, {
      ...userAttributes,
      include: [{ model: Address, as: 'addresses' }],
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // Utiliza transação para garantir consistência
    await sequelize.transaction(async t => {
      // Verifica se o usuário existe
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Remove os endereços do usuário
      await Address.destroy({ where: { user_id: id }, transaction: t });

      // Remove o usuário
      await User.destroy({ where: { id }, transaction: t });
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover usuário', error: error.message });
  }
};
