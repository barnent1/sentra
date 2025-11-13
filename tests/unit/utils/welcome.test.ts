import { describe, it, expect } from 'vitest'
import { welcome } from '@/utils/welcome'

describe('welcome utility', () => {
  describe('basic functionality', () => {
    it('should return default welcome message when time is not provided', () => {
      // ARRANGE
      const name = 'Alice'

      // ACT
      const result = welcome(name)

      // ASSERT
      expect(result).toBe('Welcome, Alice!')
    })

    it('should return morning greeting when time is "morning"', () => {
      // ARRANGE
      const name = 'Bob'
      const time = 'morning'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Good morning, Bob!')
    })

    it('should return evening greeting when time is "evening"', () => {
      // ARRANGE
      const name = 'Charlie'
      const time = 'evening'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Good evening, Charlie!')
    })
  })

  describe('edge cases', () => {
    it('should return default welcome message for undefined time', () => {
      // ARRANGE
      const name = 'David'
      const time = undefined

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Welcome, David!')
    })

    it('should return default welcome message for unrecognized time values', () => {
      // ARRANGE
      const name = 'Eve'
      const time = 'afternoon'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Welcome, Eve!')
    })

    it('should handle empty name string', () => {
      // ARRANGE
      const name = ''

      // ACT
      const result = welcome(name)

      // ASSERT
      expect(result).toBe('Welcome, !')
    })

    it('should handle names with special characters', () => {
      // ARRANGE
      const name = "O'Brien"
      const time = 'morning'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe("Good morning, O'Brien!")
    })

    it('should handle names with spaces', () => {
      // ARRANGE
      const name = 'Mary Jane'
      const time = 'evening'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Good evening, Mary Jane!')
    })
  })

  describe('case sensitivity', () => {
    it('should handle "morning" in lowercase', () => {
      // ARRANGE
      const name = 'Frank'
      const time = 'morning'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Good morning, Frank!')
    })

    it('should handle "evening" in lowercase', () => {
      // ARRANGE
      const name = 'Grace'
      const time = 'evening'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Good evening, Grace!')
    })

    it('should return default message for mixed case time (not exact match)', () => {
      // ARRANGE
      const name = 'Henry'
      const time = 'Morning'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Welcome, Henry!')
    })

    it('should return default message for uppercase time (not exact match)', () => {
      // ARRANGE
      const name = 'Iris'
      const time = 'EVENING'

      // ACT
      const result = welcome(name, time)

      // ASSERT
      expect(result).toBe('Welcome, Iris!')
    })
  })
})
