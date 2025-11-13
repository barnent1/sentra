import { describe, it, expect } from 'vitest'
import { greet } from '@/utils/greet'

describe('greet', () => {
  describe('with default greeting', () => {
    it('should return "Hello, {name}!" when no greeting is provided', () => {
      // ARRANGE
      const name = 'World'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, World!')
    })

    it('should return "Hello, {name}!" for different names', () => {
      // ARRANGE
      const name = 'Alice'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, Alice!')
    })
  })

  describe('with custom greeting', () => {
    it('should return "{greeting}, {name}!" when greeting is provided', () => {
      // ARRANGE
      const name = 'Bob'
      const greeting = 'Hi'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Hi, Bob!')
    })

    it('should return "{greeting}, {name}!" for different greetings', () => {
      // ARRANGE
      const name = 'Charlie'
      const greeting = 'Hey'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Hey, Charlie!')
    })

    it('should return "{greeting}, {name}!" for longer greetings', () => {
      // ARRANGE
      const name = 'Dave'
      const greeting = 'Good morning'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Good morning, Dave!')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string as name', () => {
      // ARRANGE
      const name = ''

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, !')
    })

    it('should handle empty string as greeting', () => {
      // ARRANGE
      const name = 'Eve'
      const greeting = ''

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe(', Eve!')
    })

    it('should handle names with spaces', () => {
      // ARRANGE
      const name = 'John Doe'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, John Doe!')
    })

    it('should handle greetings with special characters', () => {
      // ARRANGE
      const name = 'Frank'
      const greeting = 'Bonjour'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Bonjour, Frank!')
    })
  })
})
