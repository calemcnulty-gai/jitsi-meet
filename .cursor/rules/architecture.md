# Architectural Rules

## Module Organization
- Follow vertical slice architecture
- Group by feature, not by type
- Keep cross-cutting concerns separate
- Use clear boundaries between layers

## Dependencies
- Dependencies must be explicitly declared
- Avoid circular dependencies
- Use dependency injection where appropriate
- Keep third-party dependencies isolated

## State Management
- Use appropriate state management for the scope:
  - Component state for UI-only state
  - Context for shared UI state
  - Redux for global application state
  - Services for business logic state
- Keep state normalized
- Document state shape

## API Design
- Use REST principles consistently
- Version all APIs
- Document API contracts
- Handle backwards compatibility

## Security
- Never store secrets in code
- Sanitize all user input
- Use proper authentication/authorization
- Follow OWASP guidelines

## Mobile Considerations
- Optimize for mobile-first
- Handle offline scenarios
- Consider battery impact
- Support different screen sizes

## Performance Boundaries
- Define performance budgets
- Set clear loading time targets
- Implement proper code splitting
- Use lazy loading where appropriate

## Monitoring and Logging
- Define log levels consistently
- Include proper context in logs
- Implement proper error tracking
- Use performance monitoring

## Build and Deploy
- Maintain clean build scripts
- Document deployment procedures
- Use proper versioning
- Implement CI/CD best practices

## Component Architecture
- Components should only handle UI and user interaction
- Business logic belongs in services
- Middleware handles side effects and state updates
- Services handle complex operations and external interactions
- Clear separation between UI and business logic

## Service Layer
- Services should be pure TypeScript (no JSX)
- Services handle complex operations
- Services manage their own cleanup
- Document service lifecycles
- Keep services focused and modular

## Middleware
- Middleware handles side effects
- Middleware coordinates between services
- Keep middleware thin - delegate to services
- Document action flows
- Clean up resources properly 