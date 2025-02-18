# Step 1: Frame Data Capture

## Local Video Element Access
- [x] Create plugin structure for video element access
- [x] Add validation to ensure we're only capturing non-organizer videos
- [x] Implement error handling for video element access
- [ ] Fix track event handling in middleware
  - [ ] Debug why TRACK_ADDED events aren't being logged
  - [ ] Verify track info structure
  - [ ] Add MutationObserver as backup for video element detection

## Screenshot Capture Implementation
- [x] Implement canvas-based frame capture
  - [x] Create canvas element with video dimensions
  - [x] Draw video frame to canvas
  - [x] Convert to PNG format
- [x] Set up 1-second interval capture mechanism
- [ ] Add performance monitoring
  - [ ] Track frame capture timing
  - [ ] Monitor memory usage
  - [ ] Add error rate tracking
- [x] Implement cleanup on component unmount

## Firebase Setup
- [x] Create new Firebase project
- [x] Configure Firebase Storage for image uploads
- [x] Set up environment variables
- [x] Add Firebase SDK to plugin
- [ ] Verify upload functionality
  - [ ] Add upload success/failure tracking
  - [ ] Implement retry logic
  - [ ] Add upload queue for rate limiting

## Data Flow Implementation
- [x] Design screenshot payload structure
  ```typescript
  interface IFramePayload {
    participantId: string;
    meetingId: string;
    timestamp: number;
    imageData: string; // base64 PNG
  }
  ```
- [x] Implement upload mechanism
- [ ] Add retry logic for failed uploads
- [ ] Implement upload queue to handle network issues
- [ ] Add upload status monitoring

## Testing & Validation
- [ ] Test capture performance across different devices
- [ ] Validate image quality and size
- [ ] Test concurrent uploads with multiple participants
- [ ] Verify metadata accuracy
- [ ] Add end-to-end tests
  - [ ] Test track event handling
  - [ ] Test video element detection
  - [ ] Test frame capture
  - [ ] Test Firebase uploads

## Documentation
- [x] Document Firebase setup process
- [x] Document plugin integration steps
- [x] Add inline code documentation
- [ ] Create troubleshooting guide
  - [ ] Common issues and solutions
  - [ ] Performance optimization tips
  - [ ] Network handling strategies

## Current Issues
1. Track events not being caught by middleware
2. Video element detection needs improvement
3. Upload verification needed
4. Performance monitoring missing

## Next Steps
1. Debug track event handling
2. Add MutationObserver for video elements
3. Implement upload verification
4. Add performance monitoring 