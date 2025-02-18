# Code Quality Rules

## Function Length
- Maximum function length: 60 lines
- Functions exceeding 40 lines should be considered for refactoring
- Single responsibility principle must be followed

## File Length
- Maximum file length: 250 lines
- Files exceeding 200 lines should be considered for splitting
- Each file should have a single, well-defined purpose

## Naming Conventions
- Use descriptive, intention-revealing names
- Functions should be verbs: `getUser`, `validateInput`, `transformData`
- Boolean variables should be predicates: `isValid`, `hasPermission`
- Avoid abbreviations unless they are widely understood (e.g., `http`, `url`)

## Comments
- Comments should explain WHY, not WHAT
- Each file should have a top-level comment explaining its purpose
- Update comments when code changes
- Include examples in comments for complex logic
- Mark TODO comments with GitHub issue numbers

## Code Organization
- Related functions should be grouped together
- Imports should be organized by:
  1. External dependencies
  2. Internal modules
  3. Type definitions
  4. Relative imports
- Export public API at the bottom of the file

## Error Handling
- Use typed errors when possible
- Always include error context
- Log errors with appropriate severity levels
- Handle edge cases explicitly

## Testing
- Every new feature must include tests
- Tests should be deterministic
- Use meaningful test descriptions
- Follow AAA pattern (Arrange, Act, Assert)

## Performance
- Avoid nested loops where possible
- Cache expensive computations
- Use appropriate data structures
- Consider memory usage in mobile contexts

## React-Specific Rules
- Use functional components
- Keep components pure when possible
- Use hooks for side effects
- Memoize expensive computations
- Props should be typed
- Never create React roots or manipulate DOM in useEffect
- Never create components dynamically - they should be part of the JSX tree
- Avoid direct DOM manipulation in React components - use refs and proper lifecycle methods
- If a feature doesn't need UI, don't make it a component

## DOM Manipulation
- Keep DOM manipulation in dedicated services
- Use proper cleanup for event listeners and intervals
- Prefer React refs over direct DOM queries
- Document any necessary direct DOM manipulation
- Always clean up DOM elements you create

## State Management
- Keep UI state in components
- Keep business logic in services
- Use middleware for side effects
- Document state shape and update patterns
- Clean up subscriptions and listeners 