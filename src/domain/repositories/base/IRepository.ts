import { Entity, EntityId } from '../../entities/shared/Entity';
import { Result, PaginatedResult, PaginationParams } from '../../../shared/types/common';

/**
 * Base repository interface defining common operations for all repositories
 * Follows the Repository pattern to abstract data access operations
 */
export interface IRepository<TEntity extends Entity<TId>, TId extends EntityId> {
  /**
   * Find an entity by its ID
   */
  findById(id: TId): Promise<Result<TEntity | null, Error>>;

  /**
   * Check if an entity exists by its ID
   */
  exists(id: TId): Promise<Result<boolean, Error>>;

  /**
   * Get the total count of entities
   */
  count(): Promise<Result<number, Error>>;
}

/**
 * Command repository interface for write operations
 * Separates command operations from query operations following CQRS principles
 */
export interface ICommandRepository<TEntity extends Entity<TId>, TId extends EntityId> 
  extends IRepository<TEntity, TId> {
  
  /**
   * Save a new entity
   */
  save(entity: TEntity): Promise<Result<TEntity, Error>>;

  /**
   * Update an existing entity
   */
  update(entity: TEntity): Promise<Result<TEntity, Error>>;

  /**
   * Delete an entity by its ID
   */
  delete(id: TId): Promise<Result<void, Error>>;

  /**
   * Save multiple entities in a transaction
   */
  saveMany(entities: TEntity[]): Promise<Result<TEntity[], Error>>;

  /**
   * Delete multiple entities by their IDs
   */
  deleteMany(ids: TId[]): Promise<Result<void, Error>>;
}

/**
 * Query repository interface for read operations
 * Optimized for data retrieval without business logic constraints
 */
export interface IQueryRepository<TEntity extends Entity<TId>, TId extends EntityId> 
  extends IRepository<TEntity, TId> {
  
  /**
   * Find all entities with pagination
   */
  findAll(params: PaginationParams): Promise<Result<PaginatedResult<TEntity>, Error>>;

  /**
   * Find entities by multiple IDs
   */
  findByIds(ids: TId[]): Promise<Result<TEntity[], Error>>;

  /**
   * Find entities matching specific criteria
   */
  findWhere(criteria: Record<string, unknown>): Promise<Result<TEntity[], Error>>;

  /**
   * Find entities with pagination and criteria
   */
  findWhereWithPagination(
    criteria: Record<string, unknown>, 
    params: PaginationParams
  ): Promise<Result<PaginatedResult<TEntity>, Error>>;
}