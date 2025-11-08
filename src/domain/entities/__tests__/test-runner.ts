/**
 * Simple test runner for domain entities
 * This validates that the entities are working correctly without requiring a full test framework
 */

import { Analysis, CreateAnalysisProps } from '../Analysis';
import { User, CreateUserProps } from '../User';
import { UserId } from '../../value-objects/UserId';
import { Score } from '../../value-objects/Score';
import { Locale } from '../../value-objects/Locale';
import { Category } from '../../value-objects/Category';
import { Email } from '../../value-objects/Email';
import { InvariantViolationError } from '../../../shared/types/errors';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];

  test(name: string, testFn: () => void | Promise<void>): void {
    try {
      const result = testFn();
      if (result instanceof Promise) {
        result
          .then(() => {
            this.results.push({ name, passed: true });
          })
          .catch((error) => {
            this.results.push({ name, passed: false, error: error.message });
          });
      } else {
        this.results.push({ name, passed: true });
      }
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  expect(actual: unknown) {
    return {
      toBe: (expected: unknown) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual: (expected: unknown) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      },
      toBeInstanceOf: (expectedClass: new (...args: unknown[]) => unknown) => {
        if (!(actual instanceof expectedClass)) {
          throw new Error(`Expected instance of ${expectedClass.name}, but got ${actual?.constructor?.name}`);
        }
      },
      toThrow: (expectedError?: new (...args: unknown[]) => Error) => {
        if (typeof actual !== 'function') {
          throw new Error('Expected a function that throws');
        }
        try {
          actual();
          throw new Error('Expected function to throw, but it did not');
        } catch (error) {
          if (expectedError && !(error instanceof expectedError)) {
            throw new Error(`Expected ${expectedError.name}, but got ${error?.constructor?.name}`);
          }
        }
      },
      toContain: (expected: unknown) => {
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) {
            throw new Error(`Expected array to contain ${expected}`);
          }
        } else if (typeof actual === 'string') {
          if (!actual.includes(expected as string)) {
            throw new Error(`Expected string to contain ${expected}`);
          }
        } else {
          throw new Error('toContain can only be used with arrays or strings');
        }
      }
    };
  }

  expectThrows(fn: () => void, expectedError?: new (...args: unknown[]) => Error): void {
    try {
      fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        throw new Error(`Expected ${expectedError.name}, but got ${error?.constructor?.name}`);
      }
    }
  }

  printResults(): void {
    console.log('\n=== Domain Entity Test Results ===\n');
    
    let passed = 0;
    let failed = 0;

    this.results.forEach(result => {
      if (result.passed) {
        console.log(`✅ ${result.name}`);
        passed++;
      } else {
        console.log(`❌ ${result.name}`);
        console.log(`   Error: ${result.error}`);
        failed++;
      }
    });

    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n❌ ${failed} test(s) failed`);
    }
  }
}

// Run the tests
const runner = new TestRunner();

// Analysis Entity Tests
runner.test('Analysis - should create with valid data', () => {
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: UserId.generate(),
    score: Score.create(85),
    locale: Locale.english(),
    category: Category.createGeneral('technology'),
    feedback: 'Great idea with strong market potential',
    suggestions: ['Consider market research', 'Validate with users']
  };

  const analysis = Analysis.create(validProps);
  
  runner.expect(analysis.id).toBeDefined();
  runner.expect(analysis.idea).toBe(validProps.idea);
  runner.expect(analysis.userId.equals(validProps.userId)).toBe(true);
  runner.expect(analysis.score.equals(validProps.score)).toBe(true);
  runner.expect(analysis.locale.equals(validProps.locale)).toBe(true);
  runner.expect(analysis.category?.equals(validProps.category!)).toBe(true);
  runner.expect(analysis.feedback).toBe(validProps.feedback);
  runner.expect(analysis.suggestions).toEqual(validProps.suggestions);
  runner.expect(analysis.createdAt).toBeInstanceOf(Date);
  runner.expect(analysis.updatedAt).toBeInstanceOf(Date);
});

runner.test('Analysis - should throw error for empty idea', () => {
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: UserId.generate(),
    score: Score.create(85),
    locale: Locale.english()
  };
  
  const invalidProps = { ...validProps, idea: '' };
  
  runner.expectThrows(() => Analysis.create(invalidProps), InvariantViolationError);
});

runner.test('Analysis - should throw error for idea too short', () => {
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: UserId.generate(),
    score: Score.create(85),
    locale: Locale.english()
  };
  
  const invalidProps = { ...validProps, idea: 'Short' };
  
  runner.expectThrows(() => Analysis.create(invalidProps), InvariantViolationError);
});

runner.test('Analysis - should update score successfully', () => {
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: UserId.generate(),
    score: Score.create(85),
    locale: Locale.english()
  };

  const analysis = Analysis.create(validProps);
  const newScore = Score.create(90);
  
  analysis.updateScore(newScore);
  
  runner.expect(analysis.score.equals(newScore)).toBe(true);
});

runner.test('Analysis - should check if high quality', () => {
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: UserId.generate(),
    score: Score.create(85),
    locale: Locale.english()
  };

  const analysis = Analysis.create(validProps);
  
  runner.expect(analysis.isHighQuality()).toBe(true);
});

runner.test('Analysis - should check if belongs to user', () => {
  const userId = UserId.generate();
  const validProps: CreateAnalysisProps = {
    idea: 'A revolutionary startup idea that will change the world',
    userId: userId,
    score: Score.create(85),
    locale: Locale.english()
  };

  const analysis = Analysis.create(validProps);
  
  runner.expect(analysis.belongsToUser(userId)).toBe(true);
  runner.expect(analysis.belongsToUser(UserId.generate())).toBe(false);
});

// User Entity Tests
runner.test('User - should create with valid data', () => {
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

  const user = User.create(validProps);
  
  runner.expect(user.id).toBeDefined();
  runner.expect(user.email.equals(validProps.email)).toBe(true);
  runner.expect(user.name).toBe(validProps.name);
  runner.expect(user.isActive).toBe(true);
  runner.expect(user.createdAt).toBeInstanceOf(Date);
  runner.expect(user.updatedAt).toBeInstanceOf(Date);
});

runner.test('User - should create with minimal data', () => {
  const validEmail = Email.create('test@example.com');
  const minimalProps: CreateUserProps = {
    email: validEmail
  };

  const user = User.create(minimalProps);
  
  runner.expect(user.id).toBeDefined();
  runner.expect(user.email.equals(minimalProps.email)).toBe(true);
  runner.expect(user.name).toBe(undefined);
  runner.expect(user.isActive).toBe(true);
  
  // Should have default preferences
  const preferences = user.preferences;
  runner.expect(preferences.defaultLocale.equals(Locale.english())).toBe(true);
  runner.expect(preferences.emailNotifications).toBe(true);
  runner.expect(preferences.analysisReminders).toBe(true);
  runner.expect(preferences.theme).toBe('auto');
});

runner.test('User - should throw error for empty name', () => {
  const validEmail = Email.create('test@example.com');
  const invalidProps = { 
    email: validEmail, 
    name: '' 
  };
  
  runner.expectThrows(() => User.create(invalidProps), InvariantViolationError);
});

runner.test('User - should update name successfully', () => {
  const validEmail = Email.create('test@example.com');
  const user = User.create({ email: validEmail, name: 'John Doe' });
  const newName = 'Jane Smith';
  
  user.updateName(newName);
  
  runner.expect(user.name).toBe(newName);
});

runner.test('User - should record login', () => {
  const validEmail = Email.create('test@example.com');
  const user = User.create({ email: validEmail });
  
  runner.expect(user.lastLoginAt).toBe(undefined);
  
  user.recordLogin();
  
  runner.expect(user.lastLoginAt).toBeInstanceOf(Date);
});

runner.test('User - should activate and deactivate', () => {
  const validEmail = Email.create('test@example.com');
  const user = User.create({ email: validEmail });
  
  runner.expect(user.isActive).toBe(true);
  
  user.deactivate();
  runner.expect(user.isActive).toBe(false);
  
  user.activate();
  runner.expect(user.isActive).toBe(true);
});

runner.test('User - should check if has complete profile', () => {
  const validEmail = Email.create('test@example.com');
  const userWithName = User.create({ email: validEmail, name: 'John Doe' });
  const userWithoutName = User.create({ email: validEmail });
  
  runner.expect(userWithName.hasCompleteProfile()).toBe(true);
  runner.expect(userWithoutName.hasCompleteProfile()).toBe(false);
});

runner.test('User - should get display name', () => {
  const validEmail = Email.create('test@example.com');
  const userWithName = User.create({ email: validEmail, name: 'John Doe' });
  const userWithoutName = User.create({ email: validEmail });
  
  runner.expect(userWithName.displayName).toBe('John Doe');
  runner.expect(userWithoutName.displayName).toBe('test');
});

// Print results
setTimeout(() => {
  runner.printResults();
}, 100);