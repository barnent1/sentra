/**
 * Greets a person with a customizable greeting
 *
 * @param name - The name of the person to greet
 * @param greeting - Optional greeting message (defaults to "Hello")
 * @returns A formatted greeting string in the format "{greeting}, {name}!"
 *
 * @example
 * ```ts
 * greet('World') // Returns: "Hello, World!"
 * greet('Alice', 'Hi') // Returns: "Hi, Alice!"
 * greet('Bob', 'Good morning') // Returns: "Good morning, Bob!"
 * ```
 */
export function greet(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}!`
}
