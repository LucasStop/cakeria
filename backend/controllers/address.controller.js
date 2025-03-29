const { Address } = require('../models');

exports.findAll = async (req, res) => {
  try {
    const addresses = await Address.findAll();
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar endereços', error: error.message });
  }
};

exports.findByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const addresses = await Address.findAll({
      where: { user_id: userId },
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar endereços do usuário', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const address = await Address.findByPk(id);
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar endereço', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const address = await Address.create(req.body);
    res.status(201).json(address);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar endereço', error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Address.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }
    const address = await Address.findByPk(id);
    res.json(address);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar endereço', error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Address.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover endereço', error: error.message });
  }
};
