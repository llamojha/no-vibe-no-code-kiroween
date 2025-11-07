import { describe, it, expect, beforeEach } from 'vitest';
import { User, CreateUserProps, ReconstructUserProps, UserPreferences } from '../User';
import { UserId } from '../../value-objects/UserId';
import { Email } from '../../value-objects/Email';
import { Locale } from '../../value-objects/Locale';
import { BusinessRuleViolationError, InvariantViolationError } from '../../../shared/types/errors';

describe('User Entity', () => {
  const validEmail = Email.create('test@example.com');
  const validProps: CreateUserProps = {
    email: validEmail,
    name: 'John Doe',
    preferences: {
      defaultLocale: Locale.english(),
      emailNotifications: true,
      analysisReminders: false,
      theme: 'dark'
    }
  };

  describe('create', () => {
    it('should create user with valid data', () => {
      const user = User.create(validProps);
      
      expect(user.id).toBeDefined();
      expect(user.email.equals(validProps.email)).toBe(true);
      expect(user.name).toBe(validProps.name);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.lastLoginAt).toBeUndefined();
      
      const preferences = user.preferences;
      expect(preferences.defaultLocale.equals(validProps.preferences!.defaultLocale!)).toBe(true);
      expect(preferences.emailNotifications).toBe(validProps.preferences!.emailNotifications);
      expect(preferences.analysisReminders).toBe(validProps.preferences!.analysisReminders);
      expect(preferences.theme).toBe(validProps.preferences!.theme);
    });

    it('should create user with minimal required data', () => {
      const minimalProps: CreateUserProps = {
        email: validEmail
      };

      const user = User.create(minimalProps);
      
      expect(user.id).toBeDefined();
      expect(user.email.equals(minimalProps.email)).toBe(true);
      expect(user.name).toBeUndefined();
      expect(user.isActive).toBe(true);
      
      // Should have default preferences
      const preferences = user.preferences;
      expect(preferences.defaultLocale.equals(Locale.english())).toBe(true);
      expect(preferences.emailNotifications).toBe(true);
      expect(preferences.analysisReminders).toBe(true);
      expect(preferences.theme).toBe('auto');
    });

    it('should throw error for empty name', () => {
      const invalidProps = { ...validProps, name: '   ' }; // Whitespace only
      
      expect(() => User.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => User.create(invalidProps)).toThrow('User name cannot be empty if provided');
    });

    it('should throw error for name too long', () => {
      const invalidProps = { ...validProps, name: 'x'.repeat(101) };
      
      expect(() => User.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => User.create(invalidProps)).toThrow('User name cannot exceed 100 characters');
    });

    it('should throw error for name too short', () => {
      const invalidProps = { ...validProps, name: 'x' };
      
      expect(() => User.create(invalidProps)).toThrow(InvariantViolationError);
      expect(() => User.create(invalidProps)).toThrow('User name must be at least 2 characters long');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct user from persistence data', () => {
      const reconstructProps: ReconstructUserProps = {
        ...validProps,
        id: UserId.generate(),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        lastLoginAt: new Date('2023-01-03'),
        isActive: false,
        preferences: {
          defaultLocale: Locale.spanish(),
          emailNotifications: false,
          analysisReminders: true,
          theme: 'light'
        }
      };

      const user = User.reconstruct(reconstructProps);
      
      expect(user.id.equals(reconstructProps.id)).toBe(true);
      expect(user.createdAt).toEqual(reconstructProps.createdAt);
      expect(user.updatedAt).toEqual(reconstructProps.updatedAt);
      expect(user.lastLoginAt).toEqual(reconstructProps.lastLoginAt);
      expect(user.isActive).toBe(reconstructProps.isActive);
      expect(user.preferences).toEqual(reconstructProps.preferences);
    });
  });

  describe('business methods', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(validProps);
    });

    describe('updateName', () => {
      it('should update name successfully', () => {
        const newName = 'Jane Smith';
        
        user.updateName(newName);
        
        expect(user.name).toBe(newName);
      });

      it('should trim whitespace from name', () => {
        user.updateName('  Trimmed Name  ');
        expect(user.name).toBe('Trimmed Name');
      });

      it('should throw error for empty name', () => {
        expect(() => user.updateName('')).toThrow(BusinessRuleViolationError);
        expect(() => user.updateName('')).toThrow('Name cannot be empty');
      });

      it('should throw error for name too long', () => {
        const longName = 'x'.repeat(101);
        expect(() => user.updateName(longName)).toThrow(BusinessRuleViolationError);
        expect(() => user.updateName(longName)).toThrow('Name cannot exceed 100 characters');
      });

      it('should throw error for name too short', () => {
        expect(() => user.updateName('x')).toThrow(BusinessRuleViolationError);
        expect(() => user.updateName('x')).toThrow('Name must be at least 2 characters long');
      });
    });

    describe('clearName', () => {
      it('should clear name successfully', () => {
        user.clearName();
        expect(user.name).toBeUndefined();
      });
    });

    describe('updatePreferences', () => {
      it('should update preferences successfully', () => {
        const newPreferences: Partial<UserPreferences> = {
          emailNotifications: false,
          theme: 'light'
        };
        
        user.updatePreferences(newPreferences);
        
        const preferences = user.preferences;
        expect(preferences.emailNotifications).toBe(false);
        expect(preferences.theme).toBe('light');
        // Other preferences should remain unchanged
        expect(preferences.defaultLocale.equals(validProps.preferences!.defaultLocale!)).toBe(true);
        expect(preferences.analysisReminders).toBe(validProps.preferences!.analysisReminders);
      });
    });

    describe('updateDefaultLocale', () => {
      it('should update default locale successfully', () => {
        const newLocale = Locale.spanish();
        
        user.updateDefaultLocale(newLocale);
        
        expect(user.preferences.defaultLocale.equals(newLocale)).toBe(true);
      });
    });

    describe('setEmailNotifications', () => {
      it('should enable email notifications', () => {
        user.setEmailNotifications(true);
        expect(user.preferences.emailNotifications).toBe(true);
      });

      it('should disable email notifications', () => {
        user.setEmailNotifications(false);
        expect(user.preferences.emailNotifications).toBe(false);
      });
    });

    describe('setAnalysisReminders', () => {
      it('should enable analysis reminders', () => {
        user.setAnalysisReminders(true);
        expect(user.preferences.analysisReminders).toBe(true);
      });

      it('should disable analysis reminders', () => {
        user.setAnalysisReminders(false);
        expect(user.preferences.analysisReminders).toBe(false);
      });
    });

    describe('updateTheme', () => {
      it('should update theme to light', () => {
        user.updateTheme('light');
        expect(user.preferences.theme).toBe('light');
      });

      it('should update theme to dark', () => {
        user.updateTheme('dark');
        expect(user.preferences.theme).toBe('dark');
      });

      it('should update theme to auto', () => {
        user.updateTheme('auto');
        expect(user.preferences.theme).toBe('auto');
      });
    });

    describe('recordLogin', () => {
      it('should record login timestamp', () => {
        expect(user.lastLoginAt).toBeUndefined();
        
        user.recordLogin();
        
        expect(user.lastLoginAt).toBeInstanceOf(Date);
        expect(user.lastLoginAt!.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
      });
    });

    describe('activate', () => {
      it('should activate inactive user', () => {
        // Create inactive user
        const inactiveUser = User.reconstruct({
          ...validProps,
          id: UserId.generate(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: false,
          preferences: {
            defaultLocale: Locale.english(),
            emailNotifications: true,
            analysisReminders: true,
            theme: 'auto'
          }
        });
        
        inactiveUser.activate();
        expect(inactiveUser.isActive).toBe(true);
      });

      it('should throw error when activating already active user', () => {
        expect(() => user.activate()).toThrow(BusinessRuleViolationError);
        expect(() => user.activate()).toThrow('User is already active');
      });
    });

    describe('deactivate', () => {
      it('should deactivate active user', () => {
        user.deactivate();
        expect(user.isActive).toBe(false);
      });

      it('should throw error when deactivating already inactive user', () => {
        user.deactivate();
        expect(() => user.deactivate()).toThrow(BusinessRuleViolationError);
        expect(() => user.deactivate()).toThrow('User is already inactive');
      });
    });
  });

  describe('business queries', () => {
    describe('hasRecentActivity', () => {
      it('should return true for recent login', () => {
        const user = User.create(validProps);
        user.recordLogin();
        
        expect(user.hasRecentActivity()).toBe(true);
      });

      it('should return false for old login', () => {
        const oldLoginUser = User.reconstruct({
          ...validProps,
          id: UserId.generate(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
          isActive: true,
          preferences: {
            defaultLocale: Locale.english(),
            emailNotifications: true,
            analysisReminders: true,
            theme: 'auto'
          }
        });
        
        expect(oldLoginUser.hasRecentActivity()).toBe(false);
      });

      it('should return false for never logged in user', () => {
        const user = User.create(validProps);
        expect(user.hasRecentActivity()).toBe(false);
      });
    });

    describe('isNewUser', () => {
      it('should return true for recently created user', () => {
        const user = User.create(validProps);
        expect(user.isNewUser()).toBe(true);
      });

      it('should return false for old user', () => {
        const oldUser = User.reconstruct({
          ...validProps,
          id: UserId.generate(),
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          updatedAt: new Date(),
          isActive: true,
          preferences: {
            defaultLocale: Locale.english(),
            emailNotifications: true,
            analysisReminders: true,
            theme: 'auto'
          }
        });
        
        expect(oldUser.isNewUser()).toBe(false);
      });
    });

    describe('getDaysSinceCreation', () => {
      it('should return correct days since creation', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const oldUser = User.reconstruct({
          ...validProps,
          id: UserId.generate(),
          createdAt: threeDaysAgo,
          updatedAt: new Date(),
          isActive: true,
          preferences: {
            defaultLocale: Locale.english(),
            emailNotifications: true,
            analysisReminders: true,
            theme: 'auto'
          }
        });
        
        expect(oldUser.getDaysSinceCreation()).toBe(3);
      });
    });

    describe('getDaysSinceLastLogin', () => {
      it('should return correct days since last login', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const user = User.reconstruct({
          ...validProps,
          id: UserId.generate(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: twoDaysAgo,
          isActive: true,
          preferences: {
            defaultLocale: Locale.english(),
            emailNotifications: true,
            analysisReminders: true,
            theme: 'auto'
          }
        });
        
        expect(user.getDaysSinceLastLogin()).toBe(2);
      });

      it('should return null for never logged in user', () => {
        const user = User.create(validProps);
        expect(user.getDaysSinceLastLogin()).toBeNull();
      });
    });

    describe('hasCompleteProfile', () => {
      it('should return true for user with name', () => {
        const user = User.create(validProps);
        expect(user.hasCompleteProfile()).toBe(true);
      });

      it('should return false for user without name', () => {
        const user = User.create({ email: validEmail });
        expect(user.hasCompleteProfile()).toBe(false);
      });
    });

    describe('belongsToEmailDomain', () => {
      it('should return true for matching domain', () => {
        const user = User.create(validProps);
        expect(user.belongsToEmailDomain('example.com')).toBe(true);
      });

      it('should return false for non-matching domain', () => {
        const user = User.create(validProps);
        expect(user.belongsToEmailDomain('other.com')).toBe(false);
      });
    });
  });

  describe('getters', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(validProps);
    });

    describe('displayName', () => {
      it('should return name when available', () => {
        expect(user.displayName).toBe(validProps.name);
      });

      it('should return email local part when name not available', () => {
        const userWithoutName = User.create({ email: validEmail });
        expect(userWithoutName.displayName).toBe(validEmail.localPart);
      });
    });

    describe('preferences', () => {
      it('should return copy of preferences', () => {
        const preferences = user.preferences;
        preferences.emailNotifications = !preferences.emailNotifications;
        
        // Original should not be modified
        expect(user.preferences.emailNotifications).toBe(validProps.preferences!.emailNotifications);
      });
    });
  });

  describe('getSummary', () => {
    it('should return summary for active user with name', () => {
      const user = User.create(validProps);
      const summary = user.getSummary();
      
      expect(summary).toContain(validProps.name!);
      expect(summary).toContain(validEmail.value);
      expect(summary).toContain('Active');
    });

    it('should return summary for inactive user without name', () => {
      const inactiveUser = User.reconstruct({
        email: validEmail,
        id: UserId.generate(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false,
        preferences: {
          defaultLocale: Locale.english(),
          emailNotifications: true,
          analysisReminders: true,
          theme: 'auto'
        }
      });
      
      const summary = inactiveUser.getSummary();
      
      expect(summary).toContain('Unnamed');
      expect(summary).toContain(validEmail.value);
      expect(summary).toContain('Inactive');
    });
  });
});