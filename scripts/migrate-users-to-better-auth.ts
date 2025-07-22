import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { betterAuthUser } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

// Create Supabase admin client for reading auth data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // We'll need this env var
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function migrateUsers() {
  console.log("🚀 Starting user migration from Supabase Auth to Better Auth...");

  try {
    // Get all users from Supabase Auth
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("❌ Error fetching users from Supabase Auth:", error);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of authUsers.users) {
      try {
        // Check if user already exists in Better Auth
        const existingUser = await db
          .select()
          .from(betterAuthUser)
          .where(eq(betterAuthUser.email, user.email!))
          .limit(1);

        if (existingUser.length > 0) {
          console.log(`⏭️  Skipping user ${user.email} - already exists in Better Auth`);
          skippedCount++;
          continue;
        }

        // Create user in Better Auth table
        await db.insert(betterAuthUser).values({
          id: user.id, // Keep same ID for consistency
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email!,
          emailVerified: user.email_confirmed_at != null,
          image: user.user_metadata?.avatar_url || null,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        });

        console.log(`✅ Migrated user: ${user.email}`);
        migratedCount++;
      } catch (userError) {
        console.error(`❌ Error migrating user ${user.email}:`, userError);
      }
    }

    console.log("\n🎉 Migration completed!");
    console.log(`✅ Migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped: ${skippedCount} users`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log("Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });