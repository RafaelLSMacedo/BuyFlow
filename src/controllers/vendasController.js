const prisma = require("../prisma");

function getPeriodoDatas(periodo) {
  const hoje = new Date();
  const inicio = new Date();

  switch (periodo) {
    case "7d":
      inicio.setDate(hoje.getDate() - 7);
      break;
    case "30d":
      inicio.setDate(hoje.getDate() - 30);
      break;
    case "90d":
      inicio.setDate(hoje.getDate() - 90);
      break;
    case "12m":
      inicio.setFullYear(hoje.getFullYear() - 1);
      break;
    default:
      inicio.setDate(hoje.getDate() - 30);
      break;
  }

  return { inicio, fim: hoje };
}

module.exports = {
  async getCurvaABC(req, res) {
    const periodo = req.query.periodo || "30d";

    try {
      const { inicio, fim } = getPeriodoDatas(periodo);

      // 1) Agrupa itens de venda por produto dentro do período
      const itensAgrupados = await prisma.itemVenda.groupBy({
        by: ["produtoId"],
        where: {
          venda: {
            status: "concluida",
            dataVenda: {
              gte: inicio,
              lte: fim,
            },
          },
        },
        _sum: {
          total: true,
          quantidade: true,
        },
      });

      if (itensAgrupados.length === 0) {
        return res.render("curva-abc", {
          user: req.session.user,
          periodo,
          itens: [],
          resumo: {
            totalItens: 0,
            classeA_percentual: 0,
            classeB_percentual: 0,
            classeC_percentual: 0,
          },
        });
      }

      // 2) Buscar dados dos produtos
      const produtoIds = itensAgrupados.map((i) => i.produtoId);
      const produtos = await prisma.produto.findMany({
        where: { id: { in: produtoIds } },
        select: {
          id: true,
          nome: true,
          codigo: true,
          categoria: true,
        },
      });

      // 3) Montar lista com faturamento por produto
      let itens = itensAgrupados.map((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId);

        return {
          produtoId: item.produtoId,
          nomeProduto: produto?.nome || "Desconhecido",
          codigo: produto?.codigo || "-",
          categoria: produto?.categoria || "-",
          quantidade: item._sum.quantidade || 0,
          faturamento: item._sum.total || 0,
        };
      });

      // 4) Ordenar por faturamento desc
      itens.sort((a, b) => b.faturamento - a.faturamento);

      const faturamentoTotal = itens.reduce(
        (soma, i) => soma + Number(i.faturamento || 0),
        0
      );

      // 5) Calcular % acumulado e classe ABC
      let acumulado = 0;
      let totalA = 0;
      let totalB = 0;
      let totalC = 0;

      itens = itens.map((item) => {
        const fat = Number(item.faturamento || 0);
        const perc = faturamentoTotal > 0 ? (fat / faturamentoTotal) * 100 : 0;
        acumulado += perc;

        let classe;
        if (acumulado <= 80) {
          classe = "A";
          totalA += perc;
        } else if (acumulado <= 95) {
          classe = "B";
          totalB += perc;
        } else {
          classe = "C";
          totalC += perc;
        }

        return {
          ...item,
          percentual: perc,
          percentualAcumulado: acumulado,
          classe,
        };
      });

      // 6) Resumo por classe (percentuais já em 0–100)
      const resumo = {
        totalItens: itens.length,
        classeA_percentual: Number(totalA.toFixed(2)),
        classeB_percentual: Number(totalB.toFixed(2)),
        classeC_percentual: Number(totalC.toFixed(2)),
      };

      res.render("curva-abc", {
        user: req.session.user,
        periodo,
        itens,
        resumo,
      });
    } catch (err) {
      console.error("Erro ao calcular Curva ABC:", err);
      res.render("curva-abc", {
        user: req.session.user,
        periodo,
        itens: [],
        resumo: {
          totalItens: 0,
          classeA_percentual: 0,
          classeB_percentual: 0,
          classeC_percentual: 0,
        },
      });
    }
  },
};