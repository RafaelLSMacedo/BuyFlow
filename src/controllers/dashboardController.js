const prisma = require("../prisma");

module.exports = {
  async getDashboard(req, res) {
    try {
      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);

      // Busca vendas concluídas dos últimos 30 dias
      const vendas = await prisma.venda.findMany({
        where: {
          status: "concluida",
          dataVenda: {
            gte: trintaDiasAtras,
            lte: hoje,
          },
        },
        select: {
          id: true,
          totalLiquido: true,
        },
      });

      const totalVendas = vendas.length;
      const faturamentoTotal = vendas.reduce(
        (soma, v) => soma + Number(v.totalLiquido || 0),
        0
      );
      const ticketMedio =
        totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

      // Top 5 produtos mais vendidos



      const topProdutos = await prisma.itemVenda.groupBy({
        by: ["produtoId"],
        where: {
          venda: {
            status: "concluida",
            dataVenda: {
              gte: trintaDiasAtras,
              lte: hoje,
            },
          },
        },
        _sum: {
          total: true,
          quantidade: true,
        },
        orderBy: {
          _sum: {
            total: "desc",
          },
        },
        take: 5,
      });

      // Busca os nomes dos produtos do top 5



      const produtoIds = topProdutos.map((p) => p.produtoId);
      const produtos = await prisma.produto.findMany({
        where: { id: { in: produtoIds } },
        select: { id: true, nome: true, codigo: true },
      });

      const topProdutosFormatado = topProdutos.map((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId);
        return {
          nome: produto?.nome || "Desconhecido",
          codigo: produto?.codigo || "-",
          quantidade: item._sum.quantidade || 0,
          faturamento: item._sum.total || 0,
        };
      });

      // Contagem de vendas

      
      const vendasPorPagamento = await prisma.venda.groupBy({
        by: ["formaPagamento"],
        where: {
          status: "concluida",
          dataVenda: {
            gte: trintaDiasAtras,
            lte: hoje,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      });

      res.render("dashboard", {
        user: req.session.user,
        kpis: {
          totalVendas,
          faturamentoTotal,
          ticketMedio,
        },
        topProdutos: topProdutosFormatado,
        vendasPorPagamento,
      });
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      res.render("dashboard", {
        user: req.session.user,
        kpis: {
          totalVendas: 0,
          faturamentoTotal: 0,
          ticketMedio: 0,
        },
        topProdutos: [],
        vendasPorPagamento: [],
      });
    }
  },
};