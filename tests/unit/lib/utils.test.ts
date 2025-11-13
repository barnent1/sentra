import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  describe('basic functionality', () => {
    it('should merge class names correctly', () => {
      // ARRANGE
      const classes = ['class1', 'class2']

      // ACT
      const result = cn(...classes)

      // ASSERT
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      // ARRANGE
      const condition = true

      // ACT
      const result = cn('base', condition && 'conditional')

      // ASSERT
      expect(result).toBe('base conditional')
    })

    it('should filter out falsy values', () => {
      // ARRANGE
      const condition = false

      // ACT
      const result = cn('base', condition && 'conditional', null, undefined)

      // ASSERT
      expect(result).toBe('base')
    })
  })

  describe('tailwind merge functionality', () => {
    it('should merge conflicting tailwind classes correctly', () => {
      // ARRANGE
      const baseClasses = 'px-4 py-2'
      const overrideClasses = 'px-6'

      // ACT
      const result = cn(baseClasses, overrideClasses)

      // ASSERT
      // Should keep px-6 and remove px-4 (tailwind-merge behavior)
      expect(result).toBe('py-2 px-6')
    })

    it('should handle object syntax from clsx', () => {
      // ARRANGE
      const classObject = {
        'text-red-500': true,
        'text-blue-500': false,
      }

      // ACT
      const result = cn(classObject)

      // ASSERT
      expect(result).toBe('text-red-500')
    })

    it('should merge multiple sources with conflicts', () => {
      // ARRANGE
      const base = 'bg-blue-500 text-white px-4'
      const override = { 'bg-red-500': true, 'px-6': true }

      // ACT
      const result = cn(base, override)

      // ASSERT
      expect(result).toBe('text-white bg-red-500 px-6')
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      // ARRANGE & ACT
      const result = cn()

      // ASSERT
      expect(result).toBe('')
    })

    it('should handle arrays of classes', () => {
      // ARRANGE
      const classes = ['class1', ['class2', 'class3']]

      // ACT
      const result = cn(...classes)

      // ASSERT
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle whitespace and trim correctly', () => {
      // ARRANGE
      const classes = '  class1  class2  '

      // ACT
      const result = cn(classes)

      // ASSERT
      expect(result).toBe('class1 class2')
    })
  })
})
