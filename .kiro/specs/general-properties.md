# General Properties Catalog

**Generated:** November 19, 2025
**Purpose:** Comprehensive catalog of correctness properties extracted from completed specs for property-based testing

## Overview

This document catalogs all correctness properties (invariants, business rules, system properties) extracted from completed specification design documents. These properties serve as the foundation for property-based testing to ensure system correctness across all layers of the hexagonal architecture.

---

## Property Categories

### 1. Domain Invariants

Properties that must hold true for domain entities and value objects at all times.

### 2. Data Integrity

Properties ensuring data consistency across persistence boundaries and transformations.

### 3. Business Rules

Properties enforcing business logic and domain-specific constraints.

### 4. Security Properties

Properties ensuring authentication, authorization, and data protection.

### 5. System Properties

Properties ensuring system-wide correctness like idempotency, determinism, and consistency.

---

## Domain Layer Properties

### Entity Identity Properties

**Source:** hexagonal-architecture-refactor

#### P-DOM-001: Entity ID Immutability

- **Property:** Once an entity is created, its ID never changes
- **Formal:** `∀e: Entity, ∀t1,t2: Time, e.id(t1) = e.id(t2)`
- **Test:** Create entity, verify ID remains constant through all operations
- **Violation:** Changing entity ID after creation

#### P-DOM-002: Entity ID Uniqueness

- **Property:** No two entities of the same type share an ID
- **Formal:** `∀e1,e2: Entity<T>, e1 ≠ e2 ⇒ e1.id ≠ e2.id`
- **Test:** Create multiple entities, verify all IDs are unique
- **Violation:** Duplicate IDs in entity collection

#### P-DOM-003: Entity ID Format Validity

- **Property:** All entity IDs must be valid UUIDs
- **Formal:** `∀e: Entity, isValidUUID(e.id.value) = true`
- **Test:** Generate entity, validate ID matches UUID v4 format
- **Violation:** Non-UUID string as entity ID

### Value Object Properties

**Source:** hexagonal-architecture-refactor, score-gauge-consistency

#### P-DOM-004: Value Object Immutability

- **Property:** Value objects cannot be modified after creation
- **Formal:** `∀v: ValueObject, ∀t1,t2: Time, v.value(t1) = v.value(t2)`
- **Test:** Create value object, attempt modification, verify unchanged
- **Violation:** Mutable value object fields

#### P-DOM-005: Score Bounds Validation

- **Property:** Score values must be between 0 and 100 (or 0 and 5 depending on scale)
- **Formal:** `∀s: Score, 0 ≤ s.value ≤ 100`
- **Test:** Attempt to create scores outside bounds, verify rejection
- **Violation:** Score value < 0 or > 100

#### P-DOM-006: Email Format Validation

- **Property:** Email value objects must contain valid email addresses
- **Formal:** `∀e: Email, matchesEmailRegex(e.value) = true`
- **Test:** Create email with invalid format, verify rejection
- **Violation:** Non-email string accepted as Email

#### P-DOM-007: Value Object Equality

- **Property:** Two value objects with same value are equal
- **Formal:** `∀v1,v2: ValueObject<T>, v1.value = v2.value ⇒ v1.equals(v2)`
- **Test:** Create two value objects with same value, verify equality
- **Violation:** Equal values not recognized as equal

### Analysis Entity Properties

**Source:** hexagonal-architecture-refactor, kiroween-hackathon-analyzer

#### P-DOM-008: Analysis Ownership

- **Property:** Every analysis belongs to exactly one user
- **Formal:** `∀a: Analysis, ∃!u: User, a.userId = u.id`
- **Test:** Create analysis, verify userId is set and immutable
- **Violation:** Analysis without userId or multiple userIds

#### P-DOM-009: Analysis Score Consistency

- **Property:** Analysis final score equals average of criteria scores
- **Formal:** `∀a: Analysis, a.finalScore = avg(a.criteria.map(c => c.score))`
- **Test:** Calculate score from criteria, verify matches finalScore
- **Violation:** Final score doesn't match calculated average

#### P-DOM-010: Hackathon Category Evaluation Completeness

- **Property:** Hackathon analysis must evaluate all four categories
- **Formal:** `∀h: HackathonAnalysis, |h.categoryAnalysis.evaluations| = 4`
- **Test:** Generate hackathon analysis, verify 4 category evaluations
- **Violation:** Missing category evaluation

#### P-DOM-011: Category Fit Score Bounds

- **Property:** Category fit scores must be between 0 and 5
- **Formal:** `∀c: CategoryEvaluation, 0 ≤ c.fitScore ≤ 5`
- **Test:** Generate category evaluations, verify all scores in range
- **Violation:** Fit score outside 0-5 range

### Credit System Properties

**Source:** rate-limiting-free-users

#### P-DOM-012: Credit Non-Negativity

- **Property:** User credit balance cannot be negative
- **Formal:** `∀u: User, u.credits ≥ 0`
- **Test:** Attempt to deduct credits below zero, verify rejection
- **Violation:** Negative credit balance

#### P-DOM-013: Credit Deduction Atomicity

- **Property:** Credit deduction either fully succeeds or fully fails
- **Formal:** `∀u: User, deductCredit(u) ⇒ (u.credits' = u.credits - 1) ∨ (u.credits' = u.credits ∧ error)`
- **Test:** Deduct credit with insufficient balance, verify no partial deduction
- **Violation:** Partial credit deduction

#### P-DOM-014: Default Credit Initialization

- **Property:** New users start with 3 credits
- **Formal:** `∀u: User, isNew(u) ⇒ u.credits = 3`
- **Test:** Create new user, verify credits = 3
- **Violation:** New user with credits ≠ 3

#### P-DOM-015: Credit Transaction Immutability

- **Property:** Once recorded, credit transactions cannot be modified
- **Formal:** `∀t: CreditTransaction, ∀t1,t2: Time, t.amount(t1) = t.amount(t2)`
- **Test:** Record transaction, attempt modification, verify unchanged
- **Violation:** Modified transaction record

---

## Data Integrity Properties

### Mapper Bidirectionality

**Source:** hexagonal-architecture-refactor, database-consolidation

#### P-DATA-001: Entity-DAO Round-Trip Fidelity

- **Property:** Converting entity to DAO and back yields equivalent entity
- **Formal:** `∀e: Entity, toDomain(toDAO(e)).equals(e) = true`
- **Test:** Create entity, convert to DAO, convert back, verify equality
- **Violation:** Data loss or corruption in round-trip

#### P-DATA-002: DAO-Entity Round-Trip Fidelity

- **Property:** Converting DAO to entity and back yields equivalent DAO
- **Formal:** `∀d: DAO, toDAO(toDomain(d)) = d`
- **Test:** Create DAO, convert to entity, convert back, verify equality
- **Violation:** Data loss or corruption in round-trip

#### P-DATA-003: Null Field Preservation

- **Property:** Null/undefined fields are preserved through conversions
- **Formal:** `∀e: Entity, e.field = null ⇒ toDomain(toDAO(e)).field = null`
- **Test:** Create entity with null fields, verify preserved after round-trip
- **Violation:** Null converted to empty string or default value

#### P-DATA-004: JSONB Structure Consistency

- **Property:** JSONB fields maintain structure through serialization
- **Formal:** `∀j: JSONB, parse(stringify(j)) = j`
- **Test:** Create complex JSONB, serialize and parse, verify structure
- **Violation:** Nested object structure corrupted

### Database Migration Properties

**Source:** database-consolidation

#### P-DATA-005: Migration Record Count Preservation

- **Property:** Migration preserves total record count
- **Formal:** `count(source_table) = count(target_table)`
- **Test:** Count records before and after migration, verify equal
- **Violation:** Records lost or duplicated during migration

#### P-DATA-006: Migration Data Integrity

- **Property:** All source data fields are preserved in target
- **Formal:** `∀r: SourceRecord, ∃t: TargetRecord, preservesData(r, t)`
- **Test:** Sample records before/after migration, verify data preserved
- **Violation:** Data corruption or loss during migration

#### P-DATA-007: Analysis Type Discriminator Correctness

- **Property:** Analysis type discriminator matches analysis content
- **Formal:** `∀a: Analysis, a.type = 'hackathon' ⇔ hasHackathonFields(a)`
- **Test:** Query analyses, verify type matches content structure
- **Violation:** Type mismatch with content

#### P-DATA-008: Unified Table Query Correctness

- **Property:** Querying by type returns only matching records
- **Formal:** `∀t: AnalysisType, findByType(t).all(a => a.type = t)`
- **Test:** Query by type, verify all results match type
- **Violation:** Wrong type in query results

---

## Business Rules Properties

### Scoring and Calculation

**Source:** kiroween-hackathon-analyzer, score-gauge-consistency

#### P-BIZ-001: Score Calculation Determinism

- **Property:** Same input always produces same score
- **Formal:** `∀i: Input, score(i, t1) = score(i, t2)`
- **Test:** Calculate score multiple times with same input, verify identical
- **Violation:** Non-deterministic score calculation

#### P-BIZ-002: Criteria Score Aggregation

- **Property:** Final score is average of all criteria scores
- **Formal:** `finalScore = sum(criteriaScores) / count(criteriaScores)`
- **Test:** Calculate manually from criteria, verify matches final score
- **Violation:** Incorrect aggregation formula

#### P-BIZ-003: Score Gauge Fill Percentage

- **Property:** Gauge fill percentage matches score percentage
- **Formal:** `fillPercentage = (score / maxScore) * 100`
- **Test:** Render gauge at various scores, verify fill matches calculation
- **Violation:** Visual fill doesn't match score

#### P-BIZ-004: Score Color Threshold Consistency

- **Property:** Score color matches defined thresholds
- **Formal:** `score ≥ 4.0 ⇒ color = green ∧ score ≥ 3.5 ⇒ color = yellow ∧ ...`
- **Test:** Generate scores at boundaries, verify correct colors
- **Violation:** Wrong color for score range

### Rate Limiting and Credits

**Source:** rate-limiting-free-users

#### P-BIZ-005: Credit Cost Consistency

- **Property:** All analysis types cost 1 credit
- **Formal:** `∀t: AnalysisType, getCost(t) = 1`
- **Test:** Request cost for all types, verify all return 1
- **Violation:** Different costs for different types

#### P-BIZ-006: Insufficient Credits Rejection

- **Property:** Analysis request with zero credits is rejected
- **Formal:** `∀u: User, u.credits = 0 ⇒ canAnalyze(u) = false`
- **Test:** Attempt analysis with zero credits, verify rejection
- **Violation:** Analysis allowed with zero credits

#### P-BIZ-007: Credit Deduction Before Analysis

- **Property:** Credits are deducted before analysis execution
- **Formal:** `∀a: Analysis, deductCredit() happens-before analyze()`
- **Test:** Monitor credit balance during analysis, verify deduction first
- **Violation:** Analysis executes before credit deduction

#### P-BIZ-008: Transaction Recording Completeness

- **Property:** Every credit change has a corresponding transaction record
- **Formal:** `∀Δc: CreditChange, ∃t: Transaction, t.amount = Δc`
- **Test:** Change credits, verify transaction recorded
- **Violation:** Credit change without transaction

### Category Evaluation

**Source:** kiroween-hackathon-analyzer

#### P-BIZ-009: Best Match Category Selection

- **Property:** Best match category has highest fit score
- **Formal:** `∀h: HackathonAnalysis, h.bestMatch.fitScore = max(h.evaluations.map(e => e.fitScore))`
- **Test:** Generate analysis, verify best match has highest score
- **Violation:** Best match doesn't have highest score

#### P-BIZ-010: Category Explanation Presence

- **Property:** Every category evaluation includes an explanation
- **Formal:** `∀c: CategoryEvaluation, c.explanation ≠ null ∧ c.explanation.length > 0`
- **Test:** Generate evaluations, verify all have non-empty explanations
- **Violation:** Missing or empty explanation

---

## Security Properties

### Authentication and Authorization

**Source:** security-and-ux-improvements

#### P-SEC-001: User Verification Before Session

- **Property:** User must be verified before session is retrieved
- **Formal:** `getSession() ⇒ getUser() happens-before getSession()`
- **Test:** Monitor auth flow, verify getUser called before getSession
- **Violation:** Session retrieved without user verification

#### P-SEC-002: Resource Ownership Enforcement

- **Property:** Users can only access their own resources
- **Formal:** `∀u: User, ∀r: Resource, canAccess(u, r) ⇒ r.userId = u.id`
- **Test:** Attempt to access other user's resource, verify rejection
- **Violation:** Cross-user resource access allowed

#### P-SEC-003: RLS Policy Enforcement

- **Property:** Database queries respect Row Level Security policies
- **Formal:** `∀q: Query, ∀r: Row, returns(q, r) ⇒ rlsAllows(currentUser, r)`
- **Test:** Query as different users, verify only own data returned
- **Violation:** RLS policy bypassed

#### P-SEC-004: Token Validation

- **Property:** Expired or invalid tokens are rejected
- **Formal:** `∀t: Token, (isExpired(t) ∨ ¬isValid(t)) ⇒ rejects(t)`
- **Test:** Use expired/invalid token, verify rejection
- **Violation:** Invalid token accepted

#### P-SEC-005: Authorization Check Before Data Access

- **Property:** Authorization verified before any data operation
- **Formal:** `∀op: DataOperation, authorize() happens-before op()`
- **Test:** Monitor operation sequence, verify auth check first
- **Violation:** Data access without authorization

---

## System Properties

### Idempotency and Determinism

**Source:** hexagonal-architecture-refactor, mock-system-integration-fix

#### P-SYS-001: Repository Save Idempotency

- **Property:** Saving same entity multiple times has same effect as saving once
- **Formal:** `∀e: Entity, save(e); save(e) ≡ save(e)`
- **Test:** Save entity twice, verify single record in database
- **Violation:** Duplicate records created

#### P-SYS-002: Query Result Determinism

- **Property:** Same query with same parameters returns same results
- **Formal:** `∀q: Query, ∀p: Params, query(q, p, t1) = query(q, p, t2)`
- **Test:** Execute query multiple times, verify identical results
- **Violation:** Non-deterministic query results

#### P-SYS-003: Mock Response Consistency

- **Property:** Mock service returns consistent responses for same input
- **Formal:** `∀i: Input, mock(i, t1) = mock(i, t2)`
- **Test:** Call mock service multiple times with same input, verify identical
- **Violation:** Different mock responses for same input

#### P-SYS-004: Mock Mode Isolation

- **Property:** Mock mode never makes real external calls
- **Formal:** `mockMode = true ⇒ ∀call: ExternalCall, ¬executes(call)`
- **Test:** Enable mock mode, monitor network, verify no external calls
- **Violation:** Real API call in mock mode

### Caching Properties

**Source:** rate-limiting-free-users

#### P-SYS-005: Cache Expiration

- **Property:** Cached values expire after TTL
- **Formal:** `∀k: Key, ∀v: Value, cache(k, v, ttl) ⇒ get(k, now + ttl + ε) = null`
- **Test:** Cache value with TTL, wait for expiration, verify null
- **Violation:** Expired cache value still returned

#### P-SYS-006: Cache Invalidation on Update

- **Property:** Cache is invalidated when underlying data changes
- **Formal:** `∀k: Key, update(k) ⇒ cache.get(k) = null`
- **Test:** Update data, verify cache cleared
- **Violation:** Stale cache after update

#### P-SYS-007: Cache Hit Consistency

- **Property:** Cache hit returns same value as database
- **Formal:** `∀k: Key, cache.get(k) ≠ null ⇒ cache.get(k) = db.get(k)`
- **Test:** Populate cache, verify matches database value
- **Violation:** Cache value differs from database

### Error Handling

**Source:** hexagonal-architecture-refactor, security-and-ux-improvements

#### P-SYS-008: Domain Error Propagation

- **Property:** Domain errors are not swallowed by infrastructure
- **Formal:** `∀e: DomainError, throws(domain, e) ⇒ catches(application, e)`
- **Test:** Trigger domain error, verify caught at application layer
- **Violation:** Domain error lost in infrastructure

#### P-SYS-009: Error Code Consistency

- **Property:** Same error type always has same error code
- **Formal:** `∀e1,e2: Error, type(e1) = type(e2) ⇒ e1.code = e2.code`
- **Test:** Generate same error multiple times, verify consistent codes
- **Violation:** Different codes for same error type

#### P-SYS-010: Graceful Degradation

- **Property:** System remains functional when non-critical services fail
- **Formal:** `∀s: NonCriticalService, fails(s) ⇒ systemAvailable()`
- **Test:** Disable non-critical service, verify system still works
- **Violation:** System crash on non-critical failure

### CI/CD Properties

**Source:** ci-cd-enhancement

#### P-SYS-011: Build Determinism

- **Property:** Same code always produces same build output
- **Formal:** `∀c: Code, build(c, t1) = build(c, t2)`
- **Test:** Build same commit multiple times, verify identical output
- **Violation:** Non-deterministic build artifacts

#### P-SYS-012: Test Isolation

- **Property:** Tests don't affect each other's results
- **Formal:** `∀t1,t2: Test, result(t1) independent of result(t2)`
- **Test:** Run tests in different orders, verify same results
- **Violation:** Test order affects outcomes

#### P-SYS-013: Parallel Execution Safety

- **Property:** Workflows running in parallel don't interfere
- **Formal:** `∀w1,w2: Workflow, parallel(w1, w2) ⇒ ¬interferes(w1, w2)`
- **Test:** Run workflows simultaneously, verify no conflicts
- **Violation:** Race conditions between workflows

#### P-SYS-014: Artifact Retention

- **Property:** Test artifacts are available for configured retention period
- **Formal:** `∀a: Artifact, ∀t: Time, t < retention ⇒ available(a, t)`
- **Test:** Upload artifact, verify accessible within retention period
- **Violation:** Artifact unavailable before retention expires

---

## Localization Properties

### Translation Completeness

**Source:** kiroween-hackathon-analyzer

#### P-I18N-001: Translation Key Coverage

- **Property:** All UI text has translation keys
- **Formal:** `∀t: UIText, ∃k: TranslationKey, translates(k, t)`
- **Test:** Scan UI components, verify all text uses translation keys
- **Violation:** Hardcoded text without translation

#### P-I18N-002: Language Consistency

- **Property:** No mixed languages in single message
- **Formal:** `∀m: Message, ∀w1,w2 ∈ m, language(w1) = language(w2)`
- **Test:** Generate messages, verify single language throughout
- **Violation:** Mixed language in message

#### P-I18N-003: Locale Persistence

- **Property:** User locale preference persists across sessions
- **Formal:** `∀u: User, setLocale(u, l) ⇒ getLocale(u, nextSession) = l`
- **Test:** Set locale, logout, login, verify locale preserved
- **Violation:** Locale reset between sessions

---

## Property Testing Implementation Guide

### Test Structure Template

```typescript
describe("Property: [Property Name]", () => {
  it("should hold for [scenario]", () => {
    // Arrange: Set up test data
    const input = generateTestData();

    // Act: Execute operation
    const result = performOperation(input);

    // Assert: Verify property holds
    expect(propertyHolds(result)).toBe(true);
  });

  it("should hold for edge cases", () => {
    // Test boundary conditions
  });

  it("should hold for random inputs", () => {
    // Property-based testing with random generation
  });
});
```

### Property Test Categories

1. **Invariant Tests**: Properties that must always hold
2. **Transformation Tests**: Properties about data transformations
3. **Relationship Tests**: Properties about relationships between entities
4. **Boundary Tests**: Properties at edge cases and limits
5. **Concurrency Tests**: Properties under concurrent access

---

## Property Coverage Tracking

### Coverage by Layer

- **Domain Layer**: 15 properties (P-DOM-001 to P-DOM-015)
- **Data Integrity**: 8 properties (P-DATA-001 to P-DATA-008)
- **Business Rules**: 10 properties (P-BIZ-001 to P-BIZ-010)
- **Security**: 5 properties (P-SEC-001 to P-SEC-005)
- **System**: 14 properties (P-SYS-001 to P-SYS-014)
- **Localization**: 3 properties (P-I18N-001 to P-I18N-003)

**Total Properties**: 55

### Coverage by Spec

- hexagonal-architecture-refactor: 18 properties
- database-consolidation: 8 properties
- rate-limiting-free-users: 12 properties
- score-gauge-consistency: 4 properties
- security-and-ux-improvements: 8 properties
- kiroween-hackathon-analyzer: 6 properties
- ci-cd-enhancement: 4 properties
- mock-system-integration-fix: 4 properties

---

## Next Steps

1. **Implement Property Tests**: Create test files for each property category
2. **Set Up Test Generators**: Build data generators for property-based testing
3. **Configure CI Integration**: Add property tests to CI/CD pipeline
4. **Track Coverage**: Monitor which properties have tests implemented
5. **Document Violations**: Record any property violations discovered

---

## References

- Spec: `.kiro/specs/hexagonal-architecture-refactor/design.md`
- Spec: `.kiro/specs/database-consolidation/design.md`
- Spec: `.kiro/specs/rate-limiting-free-users/design.md`
- Spec: `.kiro/specs/score-gauge-consistency/design.md`
- Spec: `.kiro/specs/security-and-ux-improvements/design.md`
- Spec: `.kiro/specs/kiroween-hackathon-analyzer/design.md`
- Spec: `.kiro/specs/ci-cd-enhancement/design.md`
- Spec: `.kiro/specs/mock-system-integration-fix/design.md`
