import { seedDemoData } from "../src/lib/seed";
import { isDemoMode } from "../src/lib/runtime";

async function main() {
  if (!isDemoMode()) {
    console.error("Refusing to seed: NEXT_PUBLIC_DEMO_MODE=false. Demo students are not created in production.");
    process.exit(1);
  }
  const result = await seedDemoData();
  console.log(result.seeded ? "Demo data created." : "Database already has records; seed skipped.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
