/**
 * Test utilities for creating properly typed auth mock objects
 */

export const createMockUser = (overrides: Partial<{
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    role: string | null;
    isAnonymous: boolean | null;
}> = {}) => ({
    id: "user123",
    email: "test@example.com",
    emailVerified: true,
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    banned: null,
    banReason: null,
    banExpires: null,
    role: null,
    isAnonymous: null,
    ...overrides
});

export const createMockSession = (overrides: Partial<{
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
    impersonatedBy: string | null;
}> = {}) => ({
    id: "session123",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    token: "token123",
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
    userId: "user123",
    impersonatedBy: null,
    ...overrides
});

export const createMockAuthSession = (userOverrides?: Parameters<typeof createMockUser>[0], sessionOverrides?: Parameters<typeof createMockSession>[0]) => {
    const user = createMockUser(userOverrides);
    const session = createMockSession({ userId: user.id, ...sessionOverrides });
    
    return {
        user,
        session
    };
};