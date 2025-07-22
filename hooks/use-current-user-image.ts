import { useSession } from "@/lib/auth-client";

export const useCurrentUserImage = () => {
  const { data: session } = useSession();
  return session?.user?.image || null;
};
