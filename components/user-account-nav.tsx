"use client";

import type { User } from "better-auth";

import Link from "next/link";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { signOut } from "@/lib/auth/auth-client";

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
    user: Pick<User, "name" | "image" | "email">;
}

export function UserAccountNav({ user }: UserAccountNavProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <UserAvatar
                    user={{
                        name: user.name ?? "",
                        image: user.image ?? "",
                    }}
                    className="h-8 w-8"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                        {user.name && <p className="font-medium">{user.name}</p>}
                        {user.email && (
                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                                {user.email}
                            </p>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(event) => {
                        event.preventDefault();
                        signOut({
                            query: {
                                callbackUrl: `${window.location.origin}/login`,
                            },
                        });
                    }}
                >
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
