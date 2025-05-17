import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats points (cents) into a dollar string.
 * Example: 3270 -> "$32.70"
 * Example: 50 -> "$0.50"
 * Example: 100 -> "$1.00"
 */
export function formatPointsAsDollars(points: number): string {
  if (typeof points !== 'number' || isNaN(points)) {
    return "$0.00"; // Return default for invalid input
  }
  const dollars = Math.floor(points / 100);
  const cents = points % 100;
  return `$${dollars}.${cents.toString().padStart(2, '0')}`;
}

// --- Password Hashing Utilities (Simple SHA-256) ---

/**
 * Hashes a password using SHA-256.
 * Returns the hash as a hex string.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return ''; // Handle empty password case
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Error hashing password:", error);
    return ''; // Return empty string on error
  }
}

/**
 * Compares a plain text password against a stored SHA-256 hash.
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;
  try {
    const hashOfInput = await hashPassword(password);
    return hashOfInput === storedHash;
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
}
