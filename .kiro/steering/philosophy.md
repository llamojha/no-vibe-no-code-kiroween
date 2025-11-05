---
inclusion: always
---

# Development Philosophy

## Scope Control & Minimalism

- **Absolute minimal scope**: Every enhancement should contain only what's needed to accomplish the task. The initial implementation should be the leanest possible version to deliver value.
- **Vertical Slicing Over Horizontal Layers**: Implement a feature end-to-end through the necessary layers of the primary system (e.g., parsing, transformation, output) before considering any work on downstream systems.
- **Downstream Systems are Default Out-of-Scope**: Modifications to downstream systems are considered out-of-scope by default. They should only be included in the initial spec if the primary feature is impossible to deliver without them. Any proposed downstream changes must be rigorously justified.
- **No fluff or over-engineering**: Avoid cleverness, premature optimization, or unnecessary complexity. Focus on simple, direct solutions to the problem at hand.
- **YAGNI ("You Aren't Gonna Need It") Principle**: Build only what is required now, not what you anticipate might be needed in the future.
- **Incremental and Iterative Development**: Break down larger initiatives into small, focused, and manageable increments that can be developed, tested, and delivered independently. This approach allows for quicker feedback and easier rollbacks if necessary.
- **Single-Focus Specs**: Initial spec documents must contain exactly ONE core requirement set and ONE user story. Any additional needs or "nice-to-haves" should be documented separately for future consideration but explicitly excluded from the current scope.

## Code Organization & Readability

- **Intuitive structure**: Organize code so developers can quickly locate relevant sections
- **Self-contained modules**: Each package should be workable without deep knowledge of other parts
- **Clear separation**: Maintain distinct boundaries between different layers of responsibility - separate how data enters the system, how it's processed, and how it exits
- **Meaningful naming**: Use descriptive names that communicate purpose and data flow

## Maintainability First

- **Long-term thinking**: Prioritize code that's easy to maintain over short-term convenience
- **Simple solutions**: Choose straightforward approaches over complex ones
- **Clear interfaces**: Design clean APIs between packages
- **Minimal dependencies**: Avoid unnecessary external dependencies
