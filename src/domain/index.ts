/**
 * Domain Layer Exports
 * 
 * This module exports all domain layer components following hexagonal architecture principles.
 * The domain layer contains pure business logic with no external dependencies.
 * 
 * @see {@link ./README.md} for detailed documentation
 */

// Domain entities and base classes
export * from './entities';

// Value objects with business validation
export * from './value-objects';

// Repository interfaces (ports)
export * from './repositories';

// Domain services with business logic
export * from './services';