require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// Produtos de exemplo
const produtos = [
  { codigo: "P001", nome: "Notebook Dell Inspiron", categoria: "Informatica", unidade: "UN" },
  { codigo: "P002", nome: "Monitor LG 24\"", categoria: "Informatica", unidade: "UN" },
  { codigo: "P003", nome: "Teclado Mecânico", categoria: "Perifericos", unidade: "UN" },
  { codigo: "P004", nome: "Mouse Gamer", categoria: "Perifericos", unidade: "UN" },
  { codigo: "P005", nome: "Headset USB", categoria: "Perifericos", unidade: "UN" },
  { codigo: "P006", nome: "Cadeira Ergonômica", categoria: "Moveis", unidade: "UN" },
  { codigo: "P007", nome: "Mesa de Escritório", categoria: "Moveis", unidade: "UN" },
  { codigo: "P008", nome: "Webcam HD", categoria: "Perifericos", unidade: "UN" },
  { codigo: "P009", nome: "HD Externo 1TB", categoria: "Armazenamento", unidade: "UN" },
  { codigo: "P010", nome: "Pen Drive 64GB", categoria: "Armazenamento", unidade: "UN" },
  { codigo: "P011", nome: "Roteador WiFi", categoria: "Redes", unidade: "UN" },
  { codigo: "P012", nome: "Switch 8 Portas", categoria: "Redes", unidade: "UN" },
  { codigo: "P013", nome: "Impressora Laser", categoria: "Impressao", unidade: "UN" },
  { codigo: "P014", nome: "Papel A4 Resma", categoria: "Papelaria", unidade: "PCT" },
  { codigo: "P015", nome: "Cartucho de Tinta", categoria: "Impressao", unidade: "UN" },
];

// Clientes de exemplo
const clientes = [
  { nome: "Empresa Alpha Ltda", documento: "11.222.333/0001-44", email: "compras@alpha.com", cidade: "São Paulo", estado: "SP" },
  { nome: "Beta Comércio ME", documento: "22.333.444/0001-55", email: "contato@beta.com", cidade: "Rio de Janeiro", estado: "RJ" },
  { nome: "Gamma Soluções SA", documento: "33.444.555/0001-66", email: "financeiro@gamma.com", cidade: "Belo Horizonte", estado: "MG" },
  { nome: "Delta Tecnologia", documento: "44.555.666/0001-77", email: "ti@delta.com", cidade: "Curitiba", estado: "PR" },
  { nome: "Epsilon Serviços", documento: "55.666.777/0001-88", email: "admin@epsilon.com", cidade: "Porto Alegre", estado: "RS" },
  { nome: "Zeta Distribuidora", documento: "66.777.888/0001-99", email: "pedidos@zeta.com", cidade: "Salvador", estado: "BA" },
  { nome: "Eta Logística", documento: "77.888.999/0001-00", email: "logistica@eta.com", cidade: "Recife", estado: "PE" },
  { nome: "Theta Varejo", documento: "88.999.000/0001-11", email: "varejo@theta.com", cidade: "Fortaleza", estado: "CE" },
];

// Formas de pagamento
const formasPagamento = ["Cartão de Crédito", "Cartão de Débito", "Boleto", "PIX", "Transferência"];

// Preços base por produto (index = posição em produtos[])
const precosBase = [3500, 1200, 350, 180, 220, 1800, 950, 280, 380, 45, 320, 480, 1500, 35, 65];

function aleatorio(min, max) {
  return Math.random() * (max - min) + min;
}

function intAleatorio(min, max) {
  return Math.floor(aleatorio(min, max + 1));
}

function dataAleatoriaNoPeriodo(diasAtras) {
  const data = new Date();
  data.setDate(data.getDate() - intAleatorio(0, diasAtras));
  data.setHours(intAleatorio(8, 18), intAleatorio(0, 59), 0, 0);
  return data;
}

function gerarNumeroVenda(index) {
  return `VND-${String(index + 1).padStart(5, "0")}`;
}

async function main() {
  console.log("Iniciando seed de vendas...");

  // 1) Cria ou recupera produtos
  console.log("Criando produtos...");
  const produtosCriados = [];
  for (const p of produtos) {
    const produto = await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    });
    produtosCriados.push(produto);
  }
  console.log(`${produtosCriados.length} produtos prontos.`);

  // 2) Cria ou recupera clientes
  console.log("Criando clientes...");
  const clientesCriados = [];
  for (const c of clientes) {
    const cliente = await prisma.cliente.upsert({
      where: { documento: c.documento },
      update: {},
      create: c,
    });
    clientesCriados.push(cliente);
  }
  console.log(`${clientesCriados.length} clientes prontos.`);

  // 3) Gera vendas nos últimos 45 dias
  console.log("Gerando vendas...");

  // Quantas vendas por dia (entre 3 e 8)
  const DIAS = 45;
  let contadorVenda = 0;
  let totalVendasCriadas = 0;

  for (let dia = 0; dia < DIAS; dia++) {
    const qtdVendasNoDia = intAleatorio(3, 8);

    for (let v = 0; v < qtdVendasNoDia; v++) {
      const dataVenda = new Date();
      dataVenda.setDate(dataVenda.getDate() - dia);
      dataVenda.setHours(intAleatorio(8, 18), intAleatorio(0, 59), 0, 0);

      const cliente = clientesCriados[intAleatorio(0, clientesCriados.length - 1)];
      const formaPagamento = formasPagamento[intAleatorio(0, formasPagamento.length - 1)];
      const desconto = parseFloat(aleatorio(0, 5).toFixed(2)); // 0% a 5% de desconto

      // Gera entre 1 e 4 itens por venda
      const qtdItens = intAleatorio(1, 4);
      const itensDaVenda = [];
      const produtosUsados = new Set();

      for (let i = 0; i < qtdItens; i++) {
        let idxProduto;
        // evitar produto duplicado na mesma venda
        do {
          idxProduto = intAleatorio(0, produtosCriados.length - 1);
        } while (produtosUsados.has(idxProduto));
        produtosUsados.add(idxProduto);

        const produto = produtosCriados[idxProduto];
        const precoBase = precosBase[idxProduto];
        const variacao = aleatorio(0.9, 1.1); // ±10% no preço
        const precoUnit = parseFloat((precoBase * variacao).toFixed(2));
        const quantidade = parseFloat(intAleatorio(1, 5).toFixed(2));
        const descontoItem = parseFloat(aleatorio(0, 3).toFixed(2)); // 0% a 3%
        const totalItem = parseFloat(
          (precoUnit * quantidade * (1 - descontoItem / 100)).toFixed(2)
        );

        itensDaVenda.push({
          produtoId: produto.id,
          quantidade,
          precoUnit,
          desconto: descontoItem,
          total: totalItem,
        });
      }

      const totalBruto = parseFloat(
        itensDaVenda.reduce((s, i) => s + i.precoUnit * i.quantidade, 0).toFixed(2)
      );
      const totalLiquido = parseFloat(
        itensDaVenda.reduce((s, i) => s + i.total, 0).toFixed(2)
      );

      await prisma.venda.create({
        data: {
          numero: gerarNumeroVenda(contadorVenda++),
          clienteId: cliente.id,
          status: "concluida",
          formaPagamento,
          desconto,
          totalBruto,
          totalLiquido,
          dataVenda,
          criadoEm: dataVenda,
          itens: {
            create: itensDaVenda,
          },
        },
      });

      totalVendasCriadas++;
    }
  }

  console.log(`✔ ${totalVendasCriadas} vendas criadas com sucesso nos últimos ${DIAS} dias!`);
}

main()
  .catch((err) => {
    console.error("Erro no seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });