'use server'

import { DatabaseService } from '@/services/database';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

const db = DatabaseService.getInstance();

/**
 * Server Action: Register a new user
 * Edge-compatible user registration with password hashing
 */
export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string | undefined;

  // Validation
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.createUser({
      email,
      password: hashedPassword,
      name,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Revalidate cache
    revalidatePath('/dashboard');

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('already exists')) {
      return { error: 'Email already registered' };
    }

    return { error: 'Failed to register user' };
  }
}

/**
 * Server Action: Login user
 * Validates credentials and returns user data
 */
export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validation
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    // Get user by email
    const user = await db.getUserByEmail(email);

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return { error: 'Invalid credentials' };
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    return { error: 'Failed to login' };
  }
}

/**
 * Server Action: Logout user
 * Clears session and revalidates cache
 */
export async function logoutUser() {
  try {
    // Revalidate all paths
    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return { error: 'Failed to logout' };
  }
}
