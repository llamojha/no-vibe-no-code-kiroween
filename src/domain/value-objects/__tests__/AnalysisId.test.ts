import { describe, it, expect } from 'vitest';
import { AnalysisId } from '../AnalysisId';

describe('AnalysisId Value Object', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const anotherValidUUID = '987fcdeb-51a2-43d1-9f12-123456789abc';

  describe('fromString', () => {
    it('should create AnalysisId with valid UUID', () => {
      const id = AnalysisId.fromString(validUUID);
      expect(id.value).toBe(validUUID);
    });

    it('should throw error for invalid UUID format', () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-42661417400g',
        '',
        'not-a-uuid-at-all'
      ];

      invalidUUIDs.forEach(invalidUUID => {
        expect(() => AnalysisId.fromString(invalidUUID))
          .toThrow(`Invalid AnalysisId format: ${invalidUUID}. Must be a valid UUID.`);
      });
    });

    it('should handle UUID with different casing', () => {
      const upperCaseUUID = validUUID.toUpperCase();
      const id = AnalysisId.fromString(upperCaseUUID);
      expect(id.value).toBe(upperCaseUUID);
    });
  });

  describe('generate', () => {
    it('should generate valid UUID', () => {
      const id = AnalysisId.generate();
      expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = AnalysisId.generate();
      const id2 = AnalysisId.generate();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should generate UUID v4 format', () => {
      const id = AnalysisId.generate();
      const parts = id.value.split('-');
      
      // Check UUID v4 format
      expect(parts).toHaveLength(5);
      expect(parts[2].charAt(0)).toBe('4'); // Version 4
      expect(['8', '9', 'a', 'b']).toContain(parts[3].charAt(0)); // Variant bits
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct AnalysisId from persistence', () => {
      const id = AnalysisId.reconstruct(validUUID);
      expect(id.value).toBe(validUUID);
    });

    it('should reconstruct without validation', () => {
      // This should work even with invalid UUID since it's for reconstruction
      const id = AnalysisId.reconstruct('invalid-but-from-persistence');
      expect(id.value).toBe('invalid-but-from-persistence');
    });
  });

  describe('equals', () => {
    it('should return true for equal IDs', () => {
      const id1 = AnalysisId.fromString(validUUID);
      const id2 = AnalysisId.fromString(validUUID);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = AnalysisId.fromString(validUUID);
      const id2 = AnalysisId.fromString(anotherValidUUID);
      expect(id1.equals(id2)).toBe(false);
    });

    it('should be case sensitive', () => {
      const id1 = AnalysisId.fromString(validUUID);
      const id2 = AnalysisId.fromString(validUUID.toUpperCase());
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const id = AnalysisId.fromString(validUUID);
      expect(id.toString()).toBe(validUUID);
    });
  });



  describe('inheritance from EntityId', () => {
    it('should inherit EntityId behavior', () => {
      const id = AnalysisId.fromString(validUUID);
      expect(id.value).toBe(validUUID);
      expect(typeof id.equals).toBe('function');
      expect(typeof id.toString).toBe('function');
    });
  });
});