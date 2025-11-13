import { describe, it, expect } from 'vitest'
import { greet } from '@/utils/greet'

describe('greet utility', () => {
  describe('basic functionality', () => {
    it('should return greeting with default "Hello"', () => {
      // ARRANGE
      const name = 'World'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, World!')
    })

    it('should return greeting with custom greeting', () => {
      // ARRANGE
      const name = 'Alice'
      const greeting = 'Hi'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Hi, Alice!')
    })

    it('should handle different names', () => {
      // ARRANGE
      const name = 'Bob'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, Bob!')
    })
  })

  describe('custom greetings', () => {
    it('should work with "Good morning"', () => {
      // ARRANGE
      const name = 'Charlie'
      const greeting = 'Good morning'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Good morning, Charlie!')
    })

    it('should work with "Welcome"', () => {
      // ARRANGE
      const name = 'Diana'
      const greeting = 'Welcome'

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe('Welcome, Diana!')
    })
  })

  describe('edge cases', () => {
    it('should handle single character names', () => {
      // ARRANGE
      const name = 'X'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, X!')
    })

    it('should handle names with spaces', () => {
      // ARRANGE
      const name = 'John Doe'

      // ACT
      const result = greet(name)

      // ASSERT
      expect(result).toBe('Hello, John Doe!')
    })

    it('should handle empty string as custom greeting', () => {
      // ARRANGE
      const name = 'Emma'
      const greeting = ''

      // ACT
      const result = greet(name, greeting)

      // ASSERT
      expect(result).toBe(', Emma!')
    })
  })
})
