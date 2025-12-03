# Design Clarification: Test Data Generation

## Question

Why does the design use `@faker-js/faker` when it's not currently in the project?

## Answer

### Current State

- The project does NOT have `@faker-js/faker` installed
- The project uses Vitest for testing (already installed)
- No random data generation library is currently present

### Design Decision: Two Options

#### Option 1: Use Faker (Recommended for Rich Testing)

**Pros:**

- Industry-standard library for test data generation
- Rich API for generating realistic data (emails, names, paragraphs, etc.)
- Well-maintained and widely used
- Makes tests more readable and maintainable

**Cons:**

- Adds a new dependency (~2MB)
- Requires `npm install @faker-js/faker --save-dev`

**When to choose:**

- If you want realistic, varied test data
- If you plan to expand property testing significantly
- If you value developer experience and test readability

#### Option 2: Use Simple Random Utilities (Minimal Approach)

**Pros:**

- Zero new dependencies
- Lightweight and fast
- Sufficient for basic property testing
- Follows project philosophy of minimal dependencies

**Cons:**

- Less realistic test data (e.g., "test1234@example.com" vs "john.doe@gmail.com")
- More code to maintain for random generation
- Less feature-rich

**When to choose:**

- If you want to avoid new dependencies
- If simple random data is sufficient
- If you prioritize minimal bundle size

### Recommendation

**Use Option 2 (Simple Random Utilities)** based on the project's development philosophy:

From `.kiro/steering/philosophy.md`:

> **Minimal dependencies**: Avoid unnecessary external dependencies

From `.kiro/steering/development-standards.md`:

> **Dependency Management**: Justify each new dependency with clear business or technical value

### Implementation with Simple Random Utilities

```typescript
// tests/properties/utils/generators.ts

/**
 * Simple random utilities (no external dependencies)
 */
const random = {
  int: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min,

  pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],

  email: () => `test${random.int(1000, 9999)}@example.com`,

  text: (words: number = 10) =>
    Array.from({ length: words }, (_, i) => `word${i}`).join(" "),

  uuid: () => crypto.randomUUID(), // Built-in Node.js function
};

// Usage examples:
const score = random.int(0, 100);
const tier = random.pick(["free", "paid", "admin"]);
const email = random.email(); // "test1234@example.com"
const idea = random.text(20); // "word0 word1 word2 ..."
```

### Benefits of Simple Approach

1. **Zero Dependencies**: No npm install needed
2. **Fast**: No library overhead
3. **Sufficient**: Meets all property testing needs
4. **Maintainable**: Simple code, easy to understand
5. **Aligned with Philosophy**: Follows project principles

### When Faker Might Be Worth It

Consider adding Faker later if:

- Property tests become extensive (>100 test files)
- You need realistic data for debugging
- You want to generate complex nested objects
- Team prefers richer test data generation

### Updated Design Approach

The design document will be updated to:

1. Use simple random utilities by default
2. Note Faker as an optional enhancement
3. Provide both implementations for reference
4. Align with project philosophy of minimal dependencies

## Conclusion

**Decision: Use simple random utilities (Option 2)**

This aligns with the project's philosophy of minimal dependencies while providing sufficient functionality for property-based testing. The simple approach is:

- Adequate for all 64 properties
- Zero new dependencies
- Fast and maintainable
- Easy to enhance later if needed

If richer test data becomes necessary, Faker can be added as an optional enhancement with proper justification.
