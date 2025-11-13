/**
 * Farewell utility function
 * Returns a farewell message with a name
 *
 * @param name - The name to include in the farewell message
 * @param message - Optional farewell message (defaults to 'Goodbye')
 * @returns Formatted farewell message
 */
export function farewell(name: string, message?: string): string {
  const farewellMessage = message ?? 'Goodbye'
  return `${farewellMessage}, ${name}! See you later.`
}
