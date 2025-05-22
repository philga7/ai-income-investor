import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('base-class', 'additional-class')).toBe('base-class additional-class');
  });

  it('handles conditional classes', () => {
    expect(cn('base-class', { 'conditional-class': true })).toBe('base-class conditional-class');
    expect(cn('base-class', { 'conditional-class': false })).toBe('base-class');
  });

  it('handles tailwind classes correctly', () => {
    const result = cn('p-4 bg-red-500', 'p-6');
    expect(result).toContain('p-6');
    expect(result).toContain('bg-red-500');
    expect(result).not.toContain('p-4');
  });

  it('handles undefined and null values', () => {
    expect(cn('base-class', undefined, null)).toBe('base-class');
  });

  it('handles multiple conditional classes', () => {
    expect(cn('base-class', {
      'class-1': true,
      'class-2': false,
      'class-3': true
    })).toBe('base-class class-1 class-3');
  });
});