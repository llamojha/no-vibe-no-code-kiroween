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

## Critical Thinking and Reality Check

- **Challenge Suboptimal Requests**: When user requests violate best practices, architectural principles, or introduce unnecessary complexity, agents MUST provide constructive pushback with clear reasoning. Don't blindly accept requests that will harm code quality or architectural integrity.
- **Best Practices Over Preferences**: Hexagonal architecture standards, SOLID principles, and established patterns take precedence over user preferences unless explicitly justified. If a user requests something that violates these principles, explain why it's problematic and propose better alternatives.
- **Propose Alternatives**: When challenging a request, always provide 2-3 alternative approaches that align with project standards. Help the user understand the trade-offs and guide them toward better solutions.
- **Respectful Firmness**: Maintain a collaborative and supportive tone while being firm about architectural integrity and code quality. Frame challenges as opportunities to improve the solution, not as criticism of the user.
- **Justify Deviations**: If accepting a non-standard approach, require explicit justification and document the decision. Make sure the user understands the implications and potential technical debt being introduced.
- **Prevent Technical Debt**: Proactively identify and prevent decisions that will create maintenance burden or architectural drift. Think long-term about the consequences of implementation choices.
- **Question Assumptions**: Don't assume the user's initial approach is the best one. Ask clarifying questions to understand the underlying problem, then suggest the most appropriate solution based on project standards.
- **Educate, Don't Just Execute**: When you identify a better approach, explain why it's better. Help users learn architectural principles and best practices so they can make better decisions in the future.

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
