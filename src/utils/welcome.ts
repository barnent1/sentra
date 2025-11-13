/**
 * Generates a welcome message for a user based on the time of day.
 *
 * @param name - The name of the user to greet
 * @param time - Optional time of day ('morning' or 'evening')
 * @returns A personalized greeting message
 *
 * @example
 * ```typescript
 * welcome('Alice') // Returns: 'Welcome, Alice!'
 * welcome('Bob', 'morning') // Returns: 'Good morning, Bob!'
 * welcome('Charlie', 'evening') // Returns: 'Good evening, Charlie!'
 * ```
 */
export function welcome(name: string, time?: string): string {
  if (time === 'morning') {
    return `Good morning, ${name}!`
  }

  if (time === 'evening') {
    return `Good evening, ${name}!`
  }

  return `Welcome, ${name}!`
}
