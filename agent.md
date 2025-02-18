# agent.md

This document outlines the functional structure of the project, providing a high-level overview of each major organizational component. Composer agents and developers modifying the code should use this as a guide to understand where functionality resides and how best to integrate or extend it.

---

## 1. Engagement-Capture Plugin

The engagement-capture plugin is designed to capture and process video frames for real-time engagement analysis. Its functionality is modularized into several key parts:

### a. Middleware (File: `react/features/engagement-capture/middleware.ts`)
- **Purpose:**  
  Intercepts track-related Redux actions (e.g., `TRACK_ADDED`, `TRACK_UPDATED`, `TRACK_REMOVED`) to determine when a video track becomes active or changes.
- **Key Responsibilities:**  
  - Validate video tracks (ensure they are remote and active).
  - Trigger frame capture via the frame capture service.
  - Dispatch an action (`ENGAGEMENT_CAPTURE_TRACK_UPDATED`) to update Redux state with capture metadata.
- **Integration Points:**  
  Registered using the `MiddlewareRegistry` and imported as part of the overall middleware bundle in `react/features/app/middlewares.any.ts`.

### b. Frame Capture Service (File: `react/features/engagement-capture/frame-capture-service.ts`)
- **Purpose:**  
  Implements the core logic for capturing frames from video streams.
- **Key Responsibilities:**  
  - Access the video element from a given Jitsi track.
  - Create a canvas element to draw the current frame.
  - Convert the canvas content to a JPEG image (as a base64 string).
  - Set up a periodic capture interval (default 30 seconds) and handle cleanup when the track is disposed.
  - Call the `uploadFrame` function from the Firebase service to store the captured image.
- **Notes for Modification:**  
  Adjust the capture interval or image format as needed for performance improvements or quality requirements.

### c. Reducer (File: `react/features/engagement-capture/reducer.ts`)
- **Purpose:**  
  Manages state for engagement capture activities.
- **Key Responsibilities:**  
  - Maintain an `activeCaptures` mapping which tracks active video captures by participant ID.
  - Update capture timestamps when a new frame is successfully captured (via the `FRAME_CAPTURED` action).
  - Handle the initiation of capture sessions using the `START_FRAME_CAPTURE` action.
- **Usage:**  
  Other modules and middleware can read from this state to monitor or further process engagement metrics.

### d. Actions & ActionTypes (Files: `react/features/engagement-capture/actions.ts` and `actionTypes.ts`)
- **Purpose:**  
  Define the triggers for starting frame capture and updating the state when a frame is captured.
- **Examples:**  
  - `startFrameCapture(participantId, meetingId)` action to initiate frame capture.
  - Action types (`START_FRAME_CAPTURE`, `FRAME_CAPTURED`) that are dispatched to the Redux store.
- **Usage:**  
  These actions interface with the middleware and reducer to ensure proper state transitions.

### e. Firebase Integration (File: `react/features/engagement-capture/firebase-service.ts`)
- **Purpose:**  
  Handles configuration and uploading of captured frames to Firebase Storage.
- **Key Responsibilities:**  
  - Initialize Firebase using project-specific configuration.
  - Provide an `uploadFrame` function that uploads the base64 image along with metadata (participant ID, meeting ID, timestamp).
- **Future Enhancements:**  
  Currently open to public access; may later be secured with auth integration.

---

## 2. Base Functionality

Core functionality that supports the entire Jitsi Meet application is housed in the base directories.

### a. Redux Middleware & Registry (`react/features/base/redux/MiddlewareRegistry`)
- **Purpose:**  
  Provides a central system for registering and aggregating middleware from all features.
- **Usage:**  
  Middleware (like engagement-capture) registers here to ensure they intercept the correct Redux actions early in the app's lifecycle.

### b. Logging (File: `react/features/base/logging/middleware.ts`)
- **Purpose:**  
  Centralizes app-wide logging and debugging.
- **Key Responsibilities:**  
  - Set up global logging transports (both for JitsiMeetJS and custom logging).
  - Integrate log collection early during `APP_WILL_MOUNT` to capture diagnostic data.
- **Notes for Developers:**  
  Modify transports or storage mechanisms if additional logging needs arise.

### c. Conference & Track Management
- **Location:**  
  Files under `react/features/base/conference/` and `react/features/base/tracks/`
- **Purpose:**  
  Manage participant connections, track events, and conference lifecycle events.
- **Usage:**  
  Engagement-capture relies on these modules to receive track events and metadata necessary for frame capture.

---

## 3. Redux Integration

The project leverages Redux to manage application state and event flow.

### a. Actions and Reducers
- **Components:**  
  Both action creators (in various feature folders) and reducers (e.g., the engagement-capture reducer) make up the state management system.
- **Best Practices:**  
  Keep actions and reducers pure; side effects should be isolated to middleware.

### b. Middleware Aggregation (File: `react/features/app/middlewares.any.ts`)
- **Purpose:**  
  Consolidates middleware from across the application, ensuring that all necessary side effects are in place before user interactions occur.
- **Order Considerations:**  
  Ensure that the engagement-capture middleware is imported early as it may rely on state or events generated by other middleware.

---

## 4. External API Interaction

Interactions with external systems and APIs are managed via dedicated modules.

### a. Jitsi External API (File: `modules/API/external/external_api.js`)
- **Purpose:**  
  Enables communication between the Jitsi Meet application and external clients.
- **Notes:**  
  While this module handles general external messaging, it’s separate from the engagement-capture functionality but may be extended in the future for richer integrations.

### b. Communication Layer
- **Roles:**  
  Handles messaging, event propagation, and data synchronization between various parts of the application (including data channels for direct peer-to-peer communication).

---

## 5. Firebase Frame Upload Service

This component is critical for transferring captured frames to the backend.

### a. Firebase Setup & Upload (File: `react/features/engagement-capture/firebase-service.ts`)
- **Purpose:**  
  Configures Firebase with necessary credentials and endpoints.
- **Key Responsibilities:**  
  - Initialize the Firebase app and storage.
  - Provide API methods (e.g., `uploadFrame`) for storing engagement frames.
- **Future Considerations:**  
  Security can be tightened later with Firebase authentication and custom token verification.

---

## Additional Development Guidelines

Refer to `.cursor/rules/development.md` for additional best practices:
- **Initialization & Cleanup:**  
  Use lifecycle hooks (`APP_WILL_MOUNT`, `APP_WILL_UNMOUNT`) to initialize components and avoid memory leaks.
- **Module Import Conventions:**  
  Always import feature modules early in the application bootstrap to ensure their middleware and side effects are registered.
- **Code Modularity:**  
  Functions should be pure and composable, with side effects isolated to specific service modules.

---

## Conclusion

The project is efficiently organized around a plugin-based architecture that integrates deeply with Jitsi Meet's Redux-based core. The engagement-capture plugin focuses on processing video frames for real-time analytics and utilizes Firebase for storing engagement data. The base framework supports this with robust logging, Redux state management, and lifecycle management of conference and track events.

This structural overview should assist developers and composer agents in navigating the codebase and making informed decisions when modifying or extending functionality.