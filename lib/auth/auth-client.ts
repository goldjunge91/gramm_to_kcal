import { createAuthClient } from "better-auth/react";

import { env } from "../env";

export const authClient = createAuthClient({
    baseURL: `${env.NEXT_PUBLIC_URL}/api/auth`,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
