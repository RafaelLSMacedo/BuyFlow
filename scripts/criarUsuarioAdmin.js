require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@buyflow.com";

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    console.log("Usuário admin já existe:", existente);
    return;
  }

  const senhaHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.usuario.create({
    data: {
      nome: "Admin",
      email,
      senha: senhaHash,
      papel: "admin",
      ativo: true,
    },
  });

  console.log("Usuário criado:", user);
}

main()
  .catch((err) => {
    console.error("Erro ao criar admin:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });