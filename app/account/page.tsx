import { redirect } from "next/navigation";

import { getUserById, upsertUser } from "@/lib/db/users";
import { createClient } from "@/lib/supabase/server";

import AccountForm from "./account-form";

export default async function Account() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user data from our database, create if doesn't exist
  let dbUser = await getUserById(data.user.id);
  
  // If user doesn't exist in our database (e.g., first OAuth login), create them
  if (!dbUser) {
    console.log(`Creating database user for first-time login: ${data.user.email}`);
    dbUser = await upsertUser(data.user);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <AccountForm user={data.user} dbUser={dbUser} />
      </div>
    </div>
  );
}
