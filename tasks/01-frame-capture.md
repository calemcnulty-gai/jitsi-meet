# Step 1: Frame Data Capture

## Local Video Element Access
- [x] Create plugin structure for video element access
- [x] Add validation to ensure we're only capturing non-organizer videos
- [x] Implement error handling for video element access
- [x] Fix track event handling in middleware
  - [x] Debug why TRACK_ADDED events aren't being logged
  - [x] Verify track info structure
  - [x] Add proper participant identification
    - [x] Use email as primary identifier
    - [x] Fall back to JWT ID
    - [x] Use local ID as final fallback
  - [x] Add proper meeting identification
    - [x] Use conference unique ID
    - [x] Fall back to conference name
    - [x] Use room as final fallback
  - [ ] Add MutationObserver as backup for video element detection

## Screenshot Capture Implementation
- [x] Implement canvas-based frame capture
  - [x] Create canvas element with video dimensions
  - [x] Draw video frame to canvas
  - [x] Convert to PNG format
- [x] Set up 1-second interval capture mechanism
- [x] Implement cleanup on component unmount

## Firebase Setup
- [x] Create new Firebase project
- [x] Configure Firebase Storage for image uploads
- [x] Set up environment variables
- [x] Add Firebase SDK to plugin

## Data Flow Implementation
- [x] Design screenshot payload structure
  ```typescript
  interface IFramePayload {
    participantId: string;  // Now prefixed with type (email:, jwt:, or local:)
    meetingId: string;      // Now using unique conference ID when available
    timestamp: number;
    imageData: string;      // base64 PNG
  }
  ```
- [x] Implement upload mechanism

  - [ ] Test Firebase uploads

## Documentation
- [x] Document Firebase setup process
- [x] Document plugin integration steps
- [x] Add inline code documentation

## Current Issues
1. Track events not being caught by middleware
2. Participant identification inconsistent
3. Meeting identification inconsistent
4. Video element detection needs improvement
5. Upload verification needed
6. Performance monitoring missing

## Next Steps
1. Debug track event handling
2. Implement reliable participant identification
3. Add MutationObserver for video elements
4. Implement upload verification
5. Add performance monitoring

## Storage Structure
```
gs://jitsi-engagement.firebasestorage.app
└── frames
    └── [unique_meeting_id]        # From conference.getMeetingUniqueId()
        └── [prefixed_participant_id]
            # Examples:
            # email:user@example.com
            # jwt:some-jwt-id
            # local:participant123
``` 