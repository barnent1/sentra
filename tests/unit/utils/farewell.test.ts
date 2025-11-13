import { describe, it, expect } from 'vitest'
import { farewell } from '@/utils/farewell'

describe('farewell utility', () => {
  describe('basic functionality', () => {
    it('should return farewell message with default "Goodbye"', () => {
      // ARRANGE
      const name = 'Alice'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, Alice! See you later.')
    })

    it('should return farewell message with custom message', () => {
      // ARRANGE
      const name = 'Bob'
      const message = 'See you soon'

      // ACT
      const result = farewell(name, message)

      // ASSERT
      expect(result).toBe('See you soon, Bob! See you later.')
    })

    it('should handle empty string as custom message', () => {
      // ARRANGE
      const name = 'Charlie'
      const message = ''

      // ACT
      const result = farewell(name, message)

      // ASSERT
      expect(result).toBe(', Charlie! See you later.')
    })
  })

  describe('edge cases', () => {
    it('should handle names with special characters', () => {
      // ARRANGE
      const name = "O'Brien"

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe("Goodbye, O'Brien! See you later.")
    })

    it('should handle names with spaces', () => {
      // ARRANGE
      const name = 'John Doe'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, John Doe! See you later.')
    })

    it('should handle single character names', () => {
      // ARRANGE
      const name = 'A'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, A! See you later.')
    })

    it('should handle long names', () => {
      // ARRANGE
      const name = 'Christopher Alexander Montgomery III'

      // ACT
      const result = farewell(name)

      // ASSERT
      expect(result).toBe('Goodbye, Christopher Alexander Montgomery III! See you later.')
    })
  })

  describe('message variations', () => {
    it('should handle different farewell messages', () => {
      // ARRANGE
      const testCases = [
        { name: 'Alice', message: 'Farewell', expected: 'Farewell, Alice! See you later.' },
        { name: 'Bob', message: 'Take care', expected: 'Take care, Bob! See you later.' },
        { name: 'Charlie', message: 'Until next time', expected: 'Until next time, Charlie! See you later.' },
        { name: 'David', message: 'Adios', expected: 'Adios, David! See you later.' },
      ]

      testCases.forEach(({ name, message, expected }) => {
        // ACT
        const result = farewell(name, message)

        // ASSERT
        expect(result).toBe(expected)
      })
    })
  })
})
