// Seed: bootstraps required initial data + system users
// Run: npm run db:seed
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── System Users ─────────────────────────────────────────────────────────────
// Passwords should be changed immediately after first login.
const SYSTEM_USERS = [
  {
    email:    "owner@newellhomes.com",
    password: "Owner@2025!",
    name:     "Mike Newell",
    role:     "OWNER" as const,
  },
  {
    email:    "admin@newellhomes.com",
    password: "Admin@2025!",
    name:     "Admin User",
    role:     "ADMIN" as const,
  },
  {
    email:    "cobrador@newellhomes.com",
    password: "Cobrador@2025!",
    name:     "Cobrador User",
    role:     "COBRADOR" as const,
  },
] as const;

async function upsertUser(user: (typeof SYSTEM_USERS)[number]) {
  // 1. Check if the UserProfile already exists
  const existing = await prisma.userProfile.findUnique({
    where: { email: user.email },
  });
  if (existing) {
    console.log(`⏭️   ${user.role} (${user.email}) — already exists, skipped`);
    return;
  }

  // 2. Create Supabase Auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email:          user.email,
      password:       user.password,
      email_confirm:  true, // auto-confirm so they can log in immediately
      user_metadata:  { role: user.role, displayName: user.name },
    });

  if (authError || !authData.user) {
    // If user already exists in Supabase, try to fetch it
    if (authError?.message?.includes("already been registered")) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuth = listData?.users?.find((u) => u.email === user.email);
      if (!existingAuth) {
        console.error(`❌  Failed to create Supabase user for ${user.email}:`, authError?.message);
        return;
      }
      // Create profile with existing Supabase UID
      await prisma.userProfile.create({
        data: {
          supabaseUid: existingAuth.id,
          name:        user.name,
          email:       user.email,
          role:        user.role,
          isActive:    true,
        },
      });
      console.log(`✅  ${user.role} profile created (linked to existing Supabase user): ${user.email}`);
      return;
    }
    console.error(`❌  Failed to create Supabase user for ${user.email}:`, authError?.message);
    return;
  }

  // 3. Create UserProfile in DB
  await prisma.userProfile.create({
    data: {
      supabaseUid: authData.user.id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      isActive:    true,
    },
  });

  console.log(`✅  ${user.role} created: ${user.email} (password: ${user.password})`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  Seeding NeWell RMS...");
  console.log("");

  // ── System Config ──────────────────────────────────────────────────────────
  const existingFeeConfig = await prisma.lateFeeConfig.findFirst({ where: { isActive: true } });
  if (!existingFeeConfig) {
    await prisma.lateFeeConfig.create({
      data: {
        name:            "Default Late Fee Policy",
        gracePeriodDays: 3,
        flatFeeDay4:     42.0,
        dailyFeeAfter:   11.35,
        isActive:        true,
      },
    });
    console.log("✅  LateFeeConfig created");
  } else {
    console.log("⏭️   LateFeeConfig already exists — skipped");
  }

  await prisma.systemConfig.upsert({
    where:  { key: "collectors" },
    update: {},
    create: {
      key:   "collectors",
      value: ["Melany Perez", "Olga Montoya", "Juliana Bonilla", "Sara Perez", "Vanessa Cifuentes Cuevas"],
    },
  });
  console.log("✅  SystemConfig (collectors)");

  await prisma.systemConfig.upsert({
    where:  { key: "houseModels" },
    update: {},
    create: {
      key:   "houseModels",
      value: ["LANGDON", "EMELIA", "NINA", "AURORA", "DELANIE", "VIANA", "LOUSIANA", "DUPLEX", "RENTA_VARIABLE"],
    },
  });
  console.log("✅  SystemConfig (houseModels)");

  await prisma.systemConfig.upsert({
    where:  { key: "cities" },
    update: {},
    create: { key: "cities", value: ["LABELLE", "LEHIGH"] },
  });
  console.log("✅  SystemConfig (cities)");

  // ── System Users ───────────────────────────────────────────────────────────
  console.log("");
  console.log("👥  Creating system users...");
  for (const user of SYSTEM_USERS) {
    await upsertUser(user);
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉  Seed complete!");
  console.log("");
  console.log("   Credentials (change passwords after first login):");
  for (const u of SYSTEM_USERS) {
    console.log(`   ${u.role.padEnd(8)}  ${u.email}  /  ${u.password}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
