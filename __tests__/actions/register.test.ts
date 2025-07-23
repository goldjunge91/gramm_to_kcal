import { signupAction } from '@/actions/register';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock modules
vi.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
    },
  },
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('signupAction', () => {
  // Reset mocks after each test for isolation
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should redirect with an error if validation fails', async () => {
    const formData = new FormData();
    formData.append('email', 'invalid-email');
    formData.append('password', '123');
    formData.append('confirmPassword', '1234');
    formData.append('name', '');

    try {
      await signupAction(formData);
    } catch (e) {
      // next/navigation redirect throws an error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/sign-up?error=Invalid%20email%20address');
  });

  it('should call signUpEmail and redirect on success', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');
    formData.append('name', 'Test User');

    // Mock the success response for this specific test
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        emailVerified: false,
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null
      },
      token: 'token-123'
    });
    try {
      await signupAction(formData);
    } catch (e) {
      // next/navigation redirect throws an error
    }

    expect(auth.api.signUpEmail).toHaveBeenCalledWith({
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should redirect with an error if signUpEmail returns no user', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');
    formData.append('name', 'Test User');

    // Mock the failure response for this specific test
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({ user: null });

    try {
      await signupAction(formData);
    } catch (e) {
      // next/navigation redirect throws an error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/sign-up?error=Account%20creation%20failed');
  });

  it('should redirect with an error if signUpEmail throws', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');
    formData.append('name', 'Test User');

    // Mock the thrown error for this specific test
    vi.mocked(auth.api.signUpEmail).mockRejectedValue(new Error('Unexpected error'));

    try {
      await signupAction(formData);
    } catch (e) {
      // next/navigation redirect throws an error
    }

    expect(redirect).toHaveBeenCalledWith('/auth/sign-up?error=Account%20creation%20failed');
  });
});