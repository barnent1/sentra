import { describe, it, expect } from 'vitest'
import { farewell } from '@/utils/farewell'

describe('farewell utility', () => {
  describe('basic functionality', () => {
    it('should return correct farewell message for a simple name', () => {
      // ARRANGE
      const name = 'Alice'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, Alice! See you soon.')
    })

    it('should return correct farewell message for a name with spaces', () => {
      // ARRANGE
      const name = 'John Doe'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, John Doe! See you soon.')
    })

    it('should return correct farewell message for a single character name', () => {
      // ARRANGE
      const name = 'A'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, A! See you soon.')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      // ARRANGE
      const name = ''

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, ! See you soon.')
    })

    it('should handle name with special characters', () => {
      // ARRANGE
      const name = "O'Brien"

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe("Goodbye, O'Brien! See you soon.")
    })

    it('should handle name with numbers', () => {
      // ARRANGE
      const name = 'User123'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, User123! See you soon.')
    })

    it('should handle name with unicode characters', () => {
      // ARRANGE
      const name = '李明'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, 李明! See you soon.')
    })

    it('should handle name with emojis', () => {
      // ARRANGE
      const name = 'Alice 👋'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, Alice 👋! See you soon.')
    })

    it('should handle very long names', () => {
      // ARRANGE
      const name = 'A'.repeat(100)

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe(`Goodbye, ${'A'.repeat(100)}! See you soon.`)
    })
  })

  describe('return value', () => {
    it('should always return a string', () => {
      // ARRANGE
      const name = 'Bob'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(typeof result).toBe('string')
    })

    it('should always include the name in the message', () => {
      // ARRANGE
      const name = 'Charlie'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toContain(name)
    })

    it('should always start with "Goodbye, "', () => {
      // ARRANGE
      const name = 'David'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toMatch(/^Goodbye, /)
    })

    it('should always end with "! See you soon."', () => {
      // ARRANGE
      const name = 'Eve'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toMatch(/! See you soon\.$/)
    })
  })
})
