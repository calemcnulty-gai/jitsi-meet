# Engagement Metrics UI Plugin - Implementation Plan

This document provides a high-level, step-by-step plan to implement the **engagement-metrics** UI plugin. The plugin will add a toolbar button during a call, and when clicked, display a modal that charts real-time engagement statistics for all users on the call via Firestore subscriptions.

---

## Stage 1: Set Up the Plugin Structure

**Objective:**  
Establish a new plugin directory with its own Redux actions, reducer, components, and services such that all functionality is self-contained.

**Steps:**
- **Directory and File Structure:**
  - Create a new directory: `react/features/engagement-metrics/`
  - Within this directory, create subdirectories as needed:
    - `actions/` (or use a single file `actions.ts`)
    - `components/`
    - `services/` (or simply create `firebaseService.ts`)
    - `hooks/` (if custom hooks are needed)

- **Files to Create:**
  - `react/features/engagement-metrics/actionTypes.ts`
  - `react/features/engagement-metrics/actions.ts`
  - `react/features/engagement-metrics/reducer.ts`
  - `react/features/engagement-metrics/components/EngagementMetricsButton.tsx`
  - `react/features/engagement-metrics/components/EngagementMetricsModal.tsx`
  - `react/features/engagement-metrics/firebaseService.ts`
  - *(Optional)* `react/features/engagement-metrics/hooks/useEngagementMetrics.ts`

**Purpose:**  
This isolation adheres to the plugin architecture best practices, maintaining separation from core Jitsi Meet code.

---

## Stage 2: Add a Toolbar Button

**Objective:**  
Provide an entry point for users by adding a button to the bottom toolbar when on a call.

**Steps:**
- **Component Implementation:**
  - Create `EngagementMetricsButton.tsx` to render a toolbar button (e.g., labeled "Metrics").
  - On button click, dispatch an action to toggle the engagement metrics modal.

  *Example snippet:*
  ```typescript
  // react/features/engagement-metrics/components/EngagementMetricsButton.tsx
  import React from 'react';
  import { useDispatch } from 'react-redux';
  import { openEngagementModal } from '../actions';

  const EngagementMetricsButton = () => {
      const dispatch = useDispatch();

      const handleClick = () => {
          dispatch(openEngagementModal());
      };

      return (
          <button onClick={handleClick} style={{ /* styling to match toolbar buttons */ }}>
              Metrics
          </button>
      );
  };

  export default EngagementMetricsButton;
  ```

- **Toolbar Integration:**
  - Modify the toolbox integration (e.g., update `react/features/toolbox/hooks.web.ts`) to include an entry for the engagement metrics button.
  - Add an entry with a key (e.g., `'engagementMetrics'`) that maps to the `EngagementMetricsButton` component.
  
**Purpose:**  
Ensure that users have an accessible UI element on the call screen to view engagement statistics.

---

## Stage 3: Create the Engagement Metrics Modal

**Objective:**  
Build a modal that displays real-time engagement charts.

**Steps:**
- **Modal Component:**
  - Create `EngagementMetricsModal.tsx`:
    - Render a modal dialog that appears only when the modal's Redux state is active.
    - Include a close button that dispatches an action to close the modal.
    - Integrate a charting library (e.g., Chart.js or D3) to visualize real-time engagement data.

  *Example snippet:*
  ```typescript
  // react/features/engagement-metrics/components/EngagementMetricsModal.tsx
  import React, { useEffect } from 'react';
  import { useDispatch, useSelector } from 'react-redux';
  import { closeEngagementModal, updateMetricsData } from '../actions';
  import { subscribeToEngagementMetrics } from '../firebaseService';
  import { RootState } from '../../app/types';

  const EngagementMetricsModal = () => {
      const dispatch = useDispatch();
      const metricsData = useSelector((state: RootState) => state['features/engagement-metrics'].metricsData);
      const modalOpen = useSelector((state: RootState) => state['features/engagement-metrics'].modalOpen);

      // Set up Firestore subscription when the modal is open
      useEffect(() => {
          if (modalOpen) {
              const unsubscribe = subscribeToEngagementMetrics((newData) => {
                  // Dispatch an update action whenever new metric docs are received
                  dispatch(updateMetricsData(newData));
              });

              // Cleanup subscription on modal close or unmount
              return () => unsubscribe();
          }
      }, [modalOpen, dispatch]);

      if (!modalOpen) {
          return null;
      }

      return (
          <div className="engagement-metrics-modal">
              <div className="modal-content">
                  <button onClick={() => dispatch(closeEngagementModal())}>Close</button>
                  <h2>Real-Time Engagement Metrics</h2>
                  {/* Render your Chart component here using metricsData */}
              </div>
          </div>
      );
  };

  export default EngagementMetricsModal;
  ```

**Purpose:**  
Provide a dedicated interface that displays live engagement analytics and subscribes to Firestore for real-time updates.

---

## Stage 4: Establish Redux State Management

**Objective:**  
Manage modal visibility and store real-time metrics data using Redux.

**Steps:**
- **Action Types:**
  - Define the following in `actionTypes.ts`:
    - `OPEN_ENGAGEMENT_MODAL`
    - `CLOSE_ENGAGEMENT_MODAL`
    - `UPDATE_METRICS_DATA`

- **Actions:**
  - Create action creators in `actions.ts`:
  ```typescript
  // react/features/engagement-metrics/actions.ts
  import { OPEN_ENGAGEMENT_MODAL, CLOSE_ENGAGEMENT_MODAL, UPDATE_METRICS_DATA } from './actionTypes';

  export function openEngagementModal() {
      return { type: OPEN_ENGAGEMENT_MODAL };
  }

  export function closeEngagementModal() {
      return { type: CLOSE_ENGAGEMENT_MODAL };
  }

  export function updateMetricsData(data: any) {
      return { type: UPDATE_METRICS_DATA, data };
  }
  ```

- **Reducer:**
  - Implement `reducer.ts` to manage the plugin state:
  ```typescript
  // react/features/engagement-metrics/reducer.ts
  import { OPEN_ENGAGEMENT_MODAL, CLOSE_ENGAGEMENT_MODAL, UPDATE_METRICS_DATA } from './actionTypes';

  export interface IEngagementMetricsState {
      modalOpen: boolean;
      metricsData: any[];
  }

  const DEFAULT_STATE: IEngagementMetricsState = {
      modalOpen: false,
      metricsData: []
  };

  export default function engagementMetricsReducer(
      state = DEFAULT_STATE,
      action: any
  ): IEngagementMetricsState {
      switch (action.type) {
          case OPEN_ENGAGEMENT_MODAL:
              return { ...state, modalOpen: true };
          case CLOSE_ENGAGEMENT_MODAL:
              return { ...state, modalOpen: false };
          case UPDATE_METRICS_DATA:
              return { ...state, metricsData: action.data };
          default:
              return state;
      }
  }
  ```

- **Registration:**  
  - Use the ReducerRegistry to register this reducer with the global Redux store.

**Purpose:**  
Centralize and manage the state of the plugin while keeping UI logic separated from side effects like data fetching.

---

## Stage 5: Implement Firestore Subscription for Real-Time Metrics

**Objective:**  
Listen to Firestore for engagement data updates.

**Steps:**
- **Firestore Service:**
  - Create `firebaseService.ts`:
  ```typescript
  // react/features/engagement-metrics/firebaseService.ts
  import firebase from 'firebase/app';
  import 'firebase/firestore';

  // Assumes Firebase has been initialized elsewhere in the project
  export function subscribeToEngagementMetrics(onUpdate: (data: any[]) => void) {
      const db = firebase.firestore();
      // Adjust the query based on where engagement-capture writes metrics data
      const unsubscribe = db
          .collection('engagementMetrics')
          .orderBy('timestamp', 'desc')
          .onSnapshot((snapshot) => {
              const metricsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              onUpdate(metricsData);
          }, (error) => {
              console.error('Error fetching engagement metrics:', error);
          });
      return unsubscribe;
  }
  ```

**Purpose:**  
Isolate Firestore-specific side effects from the UI code, ensuring that real-time updates are streamed cleanly into the Redux store.

---

## Stage 6: Integrate and Test the Plugin

**Objective:**  
Wire up all plugin components with the existing UI and perform comprehensive tests.

**Steps:**
- **Rendering the Modal:**
  - Ensure that the modal is rendered conditionally (for example, in the main app container) based on Redux state.
  
- **Toolbar Button Testing:**
  - Verify that the engagement metrics button appears in the toolbar when on a call.
  - Test the button click, modal open/close behavior, and real-time data updates.

**Purpose:**  
Confirm seamless integration with existing functionalities (e.g., toolbox integration) and verify that the engagement metrics update in real time.

---

## Stage 7: Cleanup and Performance Optimization

**Objective:**  
Ensure no memory leaks and optimize performance for real-time updates.

**Steps:**
- **Cleanup:**
  - Unsubscribe from the Firestore listener when the modal is closed.
  - Remove any event listeners or timers during component unmount.

- **Performance:**
  - Consider throttling or debouncing chart updates if updates are too frequent.
  - Optimize chart rendering for smooth, responsive feedback.

---

## Additional Considerations

- **Modifications Outside the Plugin:**
  - **Toolbar Integration:**  
    Updating files such as `react/features/toolbox/hooks.web.ts` ensures the engagement-metrics button is visible in the existing toolbar.
  - **Reducer Registration:**  
    Registering the new reducer via ReducerRegistry integrates the plugin state into the global Redux store.

- **Documentation and Maintenance:**
  - Maintain a README in the `react/features/engagement-metrics/` directory for setup instructions and future reference.
  - Follow code modularity guidelines and best practices to keep the plugin maintainable and easily understandable by LLMs.

---

This plan outlines a clear roadmap to implement the engagement-metrics UI plugin while preserving modularity and maintainability. Each stage builds upon the previous, ensuring a smooth integration with the existing codebase. 