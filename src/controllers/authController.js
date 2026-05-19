const bcrypt = require("bcryptjs");
const prisma = require("../prisma");

module.exports = {
  getLogin(req, res) {
    if (req.session.user) {
      return res.redirect("/dashboard");
    }
    res.render("login", { error: null });
  },

  async postLogin(req, res) {
    const { email, senha } = req.body;

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!usuario) {
        return res.render("login", { error: "Usuário ou senha inválidos" });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.render("login", { error: "Usuário ou senha inválidos" });
      }

      if (!usuario.ativo) {
        return res.render("login", { error: "Usuário inativo" });
      }

      // Salva na sessão (sem senha)
      req.session.user = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      };

      res.redirect("/dashboard");
    } catch (err) {
      console.error(err);
      res.render("login", { error: "Erro ao fazer login" });
    }
  },

  logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  },
};