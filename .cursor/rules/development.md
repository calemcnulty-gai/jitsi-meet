## Development Rules
### NPM
- Use NPM or NPX to install dependencies
- DO NOT use yarn
- If using npm, remember the save flag: `npm install --save`

## Plugin Development
- When developing plugins or features, NEVER modify core Jitsi Meet code
- All new functionality should be self-contained within the plugin/feature directory
- If core functionality needs to be extended, use the proper extension points provided by Jitsi Meet

## Code Quality
// ... existing code ...