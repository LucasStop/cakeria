const { Admin } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(admins);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao buscar administradores",
        error: error.message,
      });
  }
};

exports.findOne = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!admin) {
      return res.status(404).json({ message: "Administrador não encontrado" });
    }
    res.json(admin);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar administrador", error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const admin = await Admin.create(req.body);

    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    res.status(201).json(adminResponse);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erro ao criar administrador", error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Admin.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: "Administrador não encontrado" });
    }

    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res.json(admin);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro ao atualizar administrador",
        error: error.message,
      });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Admin.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Administrador não encontrado" });
    }
    res.status(204).end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao deletar administrador", error: error.message });
  }
};
