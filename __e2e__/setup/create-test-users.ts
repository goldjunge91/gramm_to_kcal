/**
 * E2E Test User Setup Script
 *
 * Pre-creates all test users in the database before running e2e tests.
 * This ensures that login tests don't fail due to missing users.
 */

import dotenv from 'dotenv';
import path from 'node:path';

import { auth } from '../../lib/auth';
import testUsers from '../fixtures/test-users.json';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

interface TestUser {
  email: string
  password: string
  name?: string
}

/**
 * Creates a test user in the database using Better Auth API
 */
async function createTestUser(user: TestUser): Promise<void> {
  try {
    console.log(`Creating test user: ${user.email}`)

    // Use Better Auth API to create user with proper password hashing
    const result = await auth.api.signUpEmail({
      body: {
        email: user.email,
        password: user.password,
        name: user.name || 'Test User',
      },
    })

    if (result.user) {
      console.log(`✅ Created user: ${user.email}`)
    }
    else {
      console.log(`⚠️  User might already exist: ${user.email}`)
    }
  }
  catch (error: any) {
    // User might already exist, which is fine
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`⚠️  User already exists: ${user.email}`)
    }
    else {
      console.error(`❌ Failed to create user ${user.email}:`, error.message)
    }
  }
}

/**
 * Main setup function - creates all test users from fixtures
 */
async function createAllTestUsers(): Promise<void> {
  console.log('🚀 Setting up E2E test users...')

  const users = [
    testUsers.validUser,
    testUsers.secondValidUser,
    // Note: Don't create invalidUser or newUser as they're used for negative tests
  ]

  // Create users sequentially to avoid database conflicts
  for (const user of users) {
    await createTestUser(user)
  }

  console.log('✅ E2E test user setup complete!')
}

/**
 * Playwright Global Setup Function
 * This function is called once before all tests
 */
export default async function globalSetup(): Promise<void> {
  try {
    await createAllTestUsers()
  }
  catch (error) {
    console.error('❌ Failed to set up test users:', error)
    // Don't fail the entire test suite if user creation fails
    // Tests should handle missing users gracefully
  }
}

// Allow running this script directly
if (require.main === module) {
  createAllTestUsers()
    .then(() => {
      console.log('Setup complete - you can now run e2e tests')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
}
