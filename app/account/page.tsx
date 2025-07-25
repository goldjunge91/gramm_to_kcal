import { redirect } from "next/navigation";

import { getUserById } from "@/lib/db/users";
import { createClient } from "@/lib/supabase/server";

import AccountForm from "./account-form";

export default async function Account() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user data from our database
  const dbUser = await getUserById(data.user.id);

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
