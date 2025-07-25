import { describe, expect, it, vi } from "vitest";

import { resetPasswordAction, updatePasswordAction } from "@/actions/password";
import { auth } from "@/lib/auth/auth";

vi.mock("@/lib/auth/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
            setPassword: vi.fn(),
        },
    },
}));

describe("password actions", () => {
    describe("resetPasswordAction", () => {
        it("should return an error if email is not provided", async () => {
            const formData = new FormData();
            const result = await resetPasswordAction(formData);
            expect(result).toEqual({ success: false, error: "Email is required" });
        });

        it("should return a success message for a valid email", async () => {
            const formData = new FormData();
            formData.append("email", "test@example.com");
            const result = await resetPasswordAction(formData);
            expect(result).toEqual({
                success: true,
                message: "Password reset is not yet implemented with Better Auth. Please contact support.",
            });
        });
    });

    describe("updatePasswordAction", () => {
        it("should return an error if password is not provided", async () => {
            const formData = new FormData();
            const result = await updatePasswordAction(formData);
            expect(result).toEqual({ success: false, error: "New password is required" });
        });

        it("should return an error if password is less than 8 characters", async () => {
            const formData = new FormData();
            formData.append("password", "1234567");
            const result = await updatePasswordAction(formData);
            expect(result).toEqual({ success: false, error: "Password must be at least 8 characters long" });
        });

        it("should return an error if user is not authenticated", async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue(null);
            const formData = new FormData();
            formData.append("password", "password123");
            const result = await updatePasswordAction(formData);
            expect(result).toEqual({ success: false, error: "User not authenticated" });
        });

        it("should update the password and return a success message", async () => {
            vi.mocked(auth.api.getSession).mockResolvedValue({
                user: {
                    id: "123",
                    email: "",
                    emailVerified: false,
                    name: "",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    image: undefined,
                    banned: false,
                    banReason: undefined,
                },
                session: {
                    id: "session-123",
                    expiresAt: new Date(),
                    token: "token-123",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ipAddress: undefined,
                    userAgent: undefined,
                    impersonatedBy: undefined,
                    userId: "123",
                },
            });
            const formData = new FormData();
            formData.append("password", "password123");
            const result = await updatePasswordAction(formData);
            expect(auth.api.setPassword).toHaveBeenCalledWith({ body: { newPassword: "password123" }, headers: new Headers() });
            expect(result).toEqual({ success: true, message: "Password updated successfully" });
        });

        it("should return an error if password update fails", async () => {
            const error = new Error("Update failed");
            vi.mocked(auth.api.getSession).mockResolvedValue({ user: {
                id: "123",
                email: "",
                emailVerified: false,
                name: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                image: undefined,
                banned: false,
                banReason: undefined,
            }, session: {
                id: "session-123",
                expiresAt: new Date(),
                token: "token-123",
                createdAt: new Date(),
                updatedAt: new Date(),
                ipAddress: undefined,
                userAgent: undefined,
                impersonatedBy: undefined,
                userId: "123",
            } });
            vi.mocked(auth.api.setPassword).mockRejectedValue(error);
            const formData = new FormData();
            formData.append("password", "password123");
            const result = await updatePasswordAction(formData);
            expect(result).toEqual({ success: false, error: "Password update failed" });
        });
    });
});
