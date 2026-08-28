import { seedDemoData } from "../src/lib/seed";

async function main() {
  const result = await seedDemoData();
  console.log(result.seeded ? "Demo data created." : "Database already has records; seed skipped.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
