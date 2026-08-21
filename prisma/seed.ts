import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const categories: { name: string; type: "INCOME" | "EXPENSE" | "INVESTMENT"; color: string }[] = [
  { name: "Salário", type: "INCOME", color: "#22c55e" },
  { name: "Freelance", type: "INCOME", color: "#16a34a" },
  { name: "Outras receitas", type: "INCOME", color: "#4ade80" },

  { name: "Moradia", type: "EXPENSE", color: "#f97316" },
  { name: "Alimentação", type: "EXPENSE", color: "#ef4444" },
  { name: "Transporte", type: "EXPENSE", color: "#eab308" },
  { name: "Saúde", type: "EXPENSE", color: "#ec4899" },
  { name: "Lazer", type: "EXPENSE", color: "#a855f7" },
  { name: "Assinaturas", type: "EXPENSE", color: "#8b5cf6" },
  { name: "Educação", type: "EXPENSE", color: "#06b6d4" },
  { name: "Compras", type: "EXPENSE", color: "#f43f5e" },
  { name: "Outros gastos", type: "EXPENSE", color: "#64748b" },

  { name: "Reserva de emergência", type: "INVESTMENT", color: "#0ea5e9" },
  { name: "Renda fixa", type: "INVESTMENT", color: "#3b82f6" },
  { name: "Renda variável", type: "INVESTMENT", color: "#6366f1" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }
  console.log(`Seed concluído: ${categories.length} categorias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
