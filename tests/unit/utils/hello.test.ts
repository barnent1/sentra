import { describe, it, expect } from 'vitest'
import { sayHello } from '@/utils/hello'

describe('sayHello', () => {
  describe('basic functionality', () => {
    it('should return greeting with provided name', () => {
      // ARRANGE
      const name = 'World'

      // ACT
      const result = sayHello(name)

      // ASSERT
      expect(result).toBe('Hello, World!')
    })

    it('should return greeting with different name', () => {
      // ARRANGE
      const name = 'Alice'

      // ACT
      const result = sayHello(name)

      // ASSERT
      expect(result).toBe('Hello, Alice!')
    })

    it('should handle names with spaces', () => {
      // ARRANGE
      const name = 'John Doe'

      // ACT
      const result = sayHello(name)

      // ASSERT
      expect(result).toBe('Hello, John Doe!')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      // ARRANGE
      const name = ''

      // ACT
      const result = sayHello(name)

      // ASSERT
      expect(result).toBe('Hello, !')
    })

    it('should handle single character name', () => {
      // ARRANGE
      const name = 'J'

      // ACT
      const result = sayHello(name)

      // ASSERT
      expect(result).toBe('Hello, J!')
    })

    it('should handle names with special characters', () => {
      // ARRANGE
      const name = "O'Brien"

      // ACT
      const result = sayHello(name)

      // ASSERT
      expect(result).toBe("Hello, O'Brien!")
    })
  })
})
