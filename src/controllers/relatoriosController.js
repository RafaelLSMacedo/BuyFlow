const prisma = require("../prisma");

function parseData(dateStr, isEnd = false) {
  if (!dateStr) return null;

  // Mudar data RUIM YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);

  // data de pessoas normais
  const d = new Date(year, month - 1, day);

  if (isEnd) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }

  return d;
}
// Filtro q tava dando errado e do nada começou a dar certo
module.exports = {
  async getRelatorios(req, res) {
    const { dataInicio, dataFim, canal } = req.query;

    //filtro de data inicio e fim

    try {
      const inicio = parseData(dataInicio);
      const fim = parseData(dataFim, true);

      const where = {
        status: "concluida",
      };

      if (inicio || fim) {
        where.dataVenda = {};
        if (inicio) where.dataVenda.gte = inicio;
        if (fim) where.dataVenda.lte = fim;
      }

      // QUANDO TOMAR VERGONHA NA CARA ADICIONA UM FILTRO PARA CANAL DE VENDAS AQUI
      // COLINHA DO CHAT GPT  if (canal && canal !== "todos") where.canal = canal;

      const vendasPorDia = await prisma.venda.groupBy({
        by: ["dataVenda"],
        where,
        _sum: {
          totalLiquido: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          dataVenda: "asc",
        },
      });

      const formatDate = (d) =>
        new Date(d).toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        });

      const resultados = vendasPorDia.map((v) => ({
        data: formatDate(v.dataVenda),
        quantidade: v._count.id,
        faturamento: v._sum.totalLiquido || 0,
        canal: "Todos", // placeholder vulgo sombrinha
      }));

      //LEMBRAR DE ATUALIZAR ESSA PARTE PARA O FILTRO DE CANAL DE VENDAS

      res.render("relatorios", {
        user: req.session.user,
        filtros: {
          dataInicio: dataInicio || "",
          dataFim: dataFim || "",
          canal: canal || "todos",
        },
        resultados,
      });
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      res.render("relatorios", {
        user: req.session.user,
        filtros: {
          dataInicio: dataInicio || "",
          dataFim: dataFim || "",
          canal: canal || "todos",
        },
        resultados: [],
      });
    }
  },
};