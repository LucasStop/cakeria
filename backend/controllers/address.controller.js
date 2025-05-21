const { Address, User } = require('../models');

exports.findAll = async (req, res) => {
  try {
    const address = await Address.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar endereços', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const address = await Address.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

  
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar endereço', error: error.message });
  }
};

exports.findByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

  
    const address = await Address.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar endereços do usuário', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { user_id, street, number, neighborhood, complement, city, state, postal_code, country } =
      req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const address = await Address.create({
      user_id,
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      postal_code,
      country,
    });

    const addressWithUser = await Address.findByPk(address.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json(addressWithUser);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar endereço', error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const address = await Address.findByPk(id);
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }


    const [updated] = await Address.update(req.body, { where: { id } });

    if (updated) {
      const updatedAddress = await Address.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });
      res.json(updatedAddress);
    } else {
      res.status(500).json({ message: 'Erro ao atualizar endereço' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar endereço', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const address = await Address.findByPk(id);
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }


    await Address.destroy({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover endereço', error: error.message });
  }
};
