const prisma = require("../prisma");

module.exports = {
  async getRelatorios(req, res) {
    res.render("relatorios", {
      user: req.session.user,
      filtros: {
        dataInicio: null,
        dataFim: null,
        canal: "todos",
      },
      resultados: [],
    });
  },
};