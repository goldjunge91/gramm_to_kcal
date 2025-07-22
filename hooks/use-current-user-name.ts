import { useSession } from "@/lib/auth-client";

export const useCurrentUserName = () => {
  const { data: session } = useSession();
  return session?.user?.name || "?";
};
