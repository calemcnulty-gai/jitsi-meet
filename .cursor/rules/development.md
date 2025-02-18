# Development Rules

## Code Navigation
- ALWAYS read the README.md in any directory where code modifications are planned
- This is critical as READMEs often contain important architectural decisions, integration points, and modification policies

## NPM
- Use NPM or NPX to install dependencies
- DO NOT use yarn
- If using npm, remember the save flag: `npm install --save`

## Plugin Development
- When developing plugins or features, NEVER modify core Jitsi Meet code
- All new functionality should be self-contained within the plugin/feature directory
- If core functionality needs to be extended, use the proper extension points provided by Jitsi Meet

### Plugin Architecture
1. **Directory Structure**
   - Place all plugin code in `react/features/[plugin-name]/`
   - Follow Jitsi's standard feature structure:
     - `middleware.ts` - Redux middleware
     - `actions.ts` - Redux actions
     - `actionTypes.ts` - Action type constants
     - `reducer.ts` - Redux reducer
     - `functions.ts` - Utility functions
     - `components/` - React components (if needed)

2. **Integration Points**
   - DO NOT import plugin code in `index.web.js`
   - Use `MiddlewareRegistry.register()` for plugin initialization
   - Use `ReducerRegistry.register()` for state management
   - Use `StateListenerRegistry.register()` for state subscriptions

3. **State Management**
   - Follow Redux patterns for state management
   - Keep plugin state under `features/[plugin-name]` in the Redux store
   - Use typed actions and state interfaces

4. **Event Handling**
   - Listen to Jitsi events through middleware
   - Handle cleanup in appropriate lifecycle events
   - Use Jitsi's action types for integration (e.g., `CONFERENCE_JOINED`, `TRACK_ADDED`)

5. **Services**
   - Place non-React logic in service files
   - Services should be singleton classes or pure functions
   - Handle cleanup in service destructors

### Best Practices
1. **Initialization**
   - Initialize plugin in middleware using `APP_WILL_MOUNT`
   - Clean up in `APP_WILL_UNMOUNT`
   - Register any required sounds, UI components early

2. **Resource Management**
   - Clean up resources when tracks are removed
   - Clear intervals and timeouts
   - Remove event listeners
   - Dispose of any created objects

3. **Error Handling**
   - Use Jitsi's logger for errors and debugging
   - Handle errors gracefully without breaking the main app
   - Provide meaningful error messages

4. **Type Safety**
   - Use TypeScript for all new code
   - Define interfaces for all state and props
   - Use Jitsi's existing type definitions where available

## Code Quality
// ... existing code ...