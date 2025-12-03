import { describe, it, expect } from 'vitest';
import { Email } from '../Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create email with valid address', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should handle complex valid email formats', () => {
      const validEmails = [
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example-domain.com',
        'test.email.with+symbol@example.com'
      ];

      validEmails.forEach(emailStr => {
        const email = Email.create(emailStr);
        expect(email.value).toBe(emailStr.toLowerCase());
      });
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email value cannot be empty');
    });

    it('should throw error for null email', () => {
      expect(() => Email.create(null as any)).toThrow('Email value cannot be empty');
    });

    it('should throw error for undefined email', () => {
      expect(() => Email.create(undefined as any)).toThrow('Email value cannot be empty');
    });

    it('should throw error for invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test @example.com',
        'test@example .com'
      ];

      invalidEmails.forEach(invalidEmail => {
        expect(() => Email.create(invalidEmail)).toThrow(`Invalid email format: ${invalidEmail}`);
      });
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct email from persistence', () => {
      const email = Email.reconstruct('test@example.com');
      expect(email.value).toBe('test@example.com');
    });
  });

  describe('localPart', () => {
    it('should return local part of email', () => {
      const email = Email.create('test.user@example.com');
      expect(email.localPart).toBe('test.user');
    });

    it('should handle complex local parts', () => {
      const email = Email.create('user+tag123@example.com');
      expect(email.localPart).toBe('user+tag123');
    });
  });

  describe('domain', () => {
    it('should return domain part of email', () => {
      const email = Email.create('test@example.com');
      expect(email.domain).toBe('example.com');
    });

    it('should handle subdomain', () => {
      const email = Email.create('test@mail.example.com');
      expect(email.domain).toBe('mail.example.com');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different casing', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('belongsToDomain', () => {
    it('should return true for matching domain', () => {
      const email = Email.create('test@example.com');
      expect(email.belongsToDomain('example.com')).toBe(true);
    });

    it('should return true for matching domain with different casing', () => {
      const email = Email.create('test@example.com');
      expect(email.belongsToDomain('EXAMPLE.COM')).toBe(true);
    });

    it('should return false for non-matching domain', () => {
      const email = Email.create('test@example.com');
      expect(email.belongsToDomain('other.com')).toBe(false);
    });

    it('should handle subdomain correctly', () => {
      const email = Email.create('test@mail.example.com');
      expect(email.belongsToDomain('mail.example.com')).toBe(true);
      expect(email.belongsToDomain('example.com')).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('toJSON', () => {
    it('should return string value for JSON serialization', () => {
      const email = Email.create('test@example.com');
      expect(email.toJSON()).toBe('test@example.com');
    });
  });
});