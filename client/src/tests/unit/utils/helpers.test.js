// tests/unit/utils/helpers.test.js - Unit tests for helper utilities

import {
  formatDate,
  truncateText,
  debounce,
  deepClone,
  isValidEmail,
  generateId,
  capitalize,
  formatNumber,
  isEmpty,
  getNestedProperty,
} from '../../../utils/helpers';

describe('Helper Utilities', () => {
  describe('formatDate', () => {
    it('should format a valid date', () => {
      const date = new Date('2023-07-15T10:30:00.000Z');
      const result = formatDate(date);
      expect(result).toBe('July 15, 2023');
    });

    it('should format a date string', () => {
      const dateString = '2023-12-25';
      const result = formatDate(dateString);
      expect(result).toMatch(/December 25, 2023/);
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('should return "Invalid Date" for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });

    it('should accept custom options', () => {
      const date = new Date('2023-07-15');
      const result = formatDate(date, { month: 'short', day: '2-digit' });
      expect(result).toMatch(/Jul 15, 2023/);
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than specified length', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long...');
    });

    it('should return original text if shorter than length', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('should use custom suffix', () => {
      const text = 'This is a long text';
      const result = truncateText(text, 10, ' [more]');
      expect(result).toBe('This is a [more]');
    });

    it('should handle null/undefined/non-string input', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText(123)).toBe('');
    });

    it('should trim whitespace before adding suffix', () => {
      const text = 'This is a text with spaces   ';
      const result = truncateText(text, 15);
      expect(result).toBe('This is a text...');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = debounce(mockFunc, 1000);

      debouncedFunc();
      expect(mockFunc).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = debounce(mockFunc, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      jest.advanceTimersByTime(1000);
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    it('should execute immediately when immediate flag is true', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = debounce(mockFunc, 1000, true);

      debouncedFunc();
      expect(mockFunc).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
    });

    it('should clone dates', () => {
      const date = new Date('2023-07-15');
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test.domain.com')).toBe(false);
    });

    it('should handle null/undefined/non-string input', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate ID with default length', () => {
      const id = generateId();
      expect(id).toHaveLength(8);
      expect(typeof id).toBe('string');
    });

    it('should generate ID with custom length', () => {
      const id = generateId(12);
      expect(id).toHaveLength(12);
    });

    it('should generate different IDs on each call', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle null/undefined/non-string input', () => {
      expect(capitalize(null)).toBe('');
      expect(capitalize(undefined)).toBe('');
      expect(capitalize(123)).toBe('');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toMatch(/1,234.56/);
    });

    it('should handle non-number input', () => {
      expect(formatNumber('not a number')).toBe('0');
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
      expect(formatNumber(NaN)).toBe('0');
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty/whitespace strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('\t\n')).toBe(true);
    });

    it('should return true for null/undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' hello ')).toBe(false);
    });
  });

  describe('getNestedProperty', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John Doe',
          age: 30,
        },
        preferences: {
          theme: 'dark',
        },
      },
    };

    it('should get nested property', () => {
      expect(getNestedProperty(testObj, 'user.profile.name')).toBe('John Doe');
      expect(getNestedProperty(testObj, 'user.preferences.theme')).toBe('dark');
    });

    it('should return default value for non-existent property', () => {
      expect(getNestedProperty(testObj, 'user.profile.email', 'N/A')).toBe('N/A');
      expect(getNestedProperty(testObj, 'nonexistent.path')).toBeNull();
    });

    it('should handle null/undefined object', () => {
      expect(getNestedProperty(null, 'user.name')).toBeNull();
      expect(getNestedProperty(undefined, 'user.name')).toBeNull();
    });

    it('should handle empty/null path', () => {
      expect(getNestedProperty(testObj, '')).toBeNull();
      expect(getNestedProperty(testObj, null)).toBeNull();
    });
  });
});
