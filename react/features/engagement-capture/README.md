# Engagement Capture Plugin

This plugin captures and processes video frames for real-time engagement analysis in Jitsi Meet. It is designed to be completely self-contained within this directory to avoid modifying core Jitsi Meet code.

## ⚠️ Important: Code Modification Policy

**ALL changes related to engagement capture functionality MUST be made within this directory.** 

Do not modify:
- Core Jitsi Meet code
- Other feature directories
- Global configuration files
- `index.web.js` or other entry points

The only exception is if you discover a bug in Jitsi Meet core that prevents this plugin from working. In that case:
1. Document the issue thoroughly
2. Create a separate PR for the core fix
3. Get approval from core maintainers

## Architecture

### Directory Structure
```
engagement-capture/
├── middleware.ts       # Redux middleware for track events
├── frame-capture-service.ts  # Core frame capture logic
├── firebase-service.ts # Firebase storage integration
├── actions.ts         # Redux actions
├── actionTypes.ts     # Action type constants
├── reducer.ts         # State management
├── constants.ts       # Shared constants
└── logger.ts          # Feature-specific logging
```

### Integration Points

This plugin integrates with Jitsi Meet exclusively through official extension points:

1. **Redux Middleware**
   - Listens for track-related events (`TRACK_ADDED`, `TRACK_UPDATED`, `TRACK_REMOVED`)
   - Automatically registered via `MiddlewareRegistry`
   - No manual imports in `index.web.js` needed

2. **State Management**
   - Uses Redux store under `features/engagement-capture`
   - Maintains capture state per participant
   - Dispatches standard Redux actions

3. **Track Management**
   - Accesses video tracks through Jitsi's track API
   - Uses standard track events for lifecycle management

## Core Components

### 1. Middleware (`middleware.ts`)
- Intercepts track events
- Validates video tracks (remote, active)
- Triggers frame capture
- Updates Redux state

### 2. Frame Capture Service (`frame-capture-service.ts`)
- Captures frames from video streams
- Creates canvas for frame extraction
- Manages capture intervals
- Handles cleanup

### 3. Firebase Service (`firebase-service.ts`)
- Handles Firebase configuration
- Uploads captured frames
- Manages storage paths

### 4. State Management
- **Actions** (`actions.ts`): Define state changes
- **Reducer** (`reducer.ts`): Updates state
- **Types** (`actionTypes.ts`): Constants for actions

## Usage

The plugin activates automatically when Jitsi Meet loads. No manual initialization is required. It will:
1. Listen for new video tracks
2. Start capture for valid remote tracks
3. Upload frames to Firebase
4. Clean up when tracks are removed

## Configuration

All configuration should be done through environment variables or the plugin's constants file:

```typescript
// constants.ts
export const CAPTURE_INTERVAL = 30000; // 30 seconds
export const IMAGE_QUALITY = 0.8;      // JPEG quality
```

## Development Guidelines

1. **Adding Features**
   - Add new files within this directory
   - Update README.md with new functionality
   - Follow existing patterns for Redux integration

2. **Testing**
   - Test with various track scenarios
   - Verify cleanup works properly
   - Check Firebase uploads succeed

3. **Performance**
   - Monitor frame capture timing
   - Watch memory usage
   - Profile Firebase uploads

4. **Error Handling**
   - Use the logger
   - Fail gracefully
   - Don't break the main app

## Troubleshooting

If you encounter issues:
1. Check the logger output
2. Verify track events are firing
3. Confirm Firebase configuration
4. Test canvas operations

Remember: Fix issues by modifying code in this directory only. If you think you need to modify core Jitsi Meet code, you're probably doing something wrong. 