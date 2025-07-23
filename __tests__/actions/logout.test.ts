import { describe, it, expect, vi } from 'vitest';
import { signOutUser } from '@/actions/logout';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

vi.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      signOut: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('signOutUser', () => {
  it('should sign out the user and redirect to the login page', async () => {
    await signOutUser();

    expect(auth.api.signOut).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('should redirect to the login page with an error message if sign out fails', async () => {
    const error = new Error('Sign out failed');
    vi.mocked(auth.api.signOut).mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await signOutUser();
    } catch (e) {
      // prevent unhandled promise rejection
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login?error=Sign out failed');
    consoleErrorSpy.mockRestore();
  });
});
