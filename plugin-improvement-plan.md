# Plugin Improvement Plan: Engagement Metrics Redux Integration

This document outlines the necessary improvements to fully integrate the engagement-metrics feature as a Redux-controlled plugin, rather than relying on a hardcoded implementation.

---

## Identified Issues

1. **Modal Visibility Not Controlled by Redux State**
   - The current implementation uses direct calls (e.g., `openDialog`) to display the engagement metrics modal, thereby bypassing Redux state management.
   - Without updating the Redux state, there is no single source of truth to control the modal's visibility.

2. **Inconsistent State Property Names**
   - The reducer currently maintains properties like `isOpen` and `modalOpen`, which causes ambiguity and inconsistency in state management.
   - Helper functions may reference outdated or mismatched state properties.

3. **Missing Global Integration of the Plugin Modal**
   - There is no dedicated container component that listens to the Redux state for modal visibility and renders the modal conditionally.
   - Directly calling `openDialog` bypasses Redux control and makes it difficult to maintain or extend the modal's behavior.

---

## Improvement Steps

### 1. Update Redux Actions

**Objective:** Dispatch Redux actions to update the modal's state rather than using direct dialog calls.

_Update the action creators as follows:_
typescript
// File: react/features/engagement-metrics/actions.ts
import { IStore } from '../app/types';
import { createToolbarEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import {
OPEN_ENGAGEMENT_MODAL,
CLOSE_ENGAGEMENT_MODAL,
UPDATE_METRICS_DATA
} from './actionTypes';
import { IEngagementMetricsAction, IMetricData } from './reducer';
/
Opens the engagement metrics modal by dispatching a Redux action.
/
export function openEngagementModal() {
return (dispatch: IStore['dispatch']) => {
sendAnalytics(createToolbarEvent('engagement.metrics.modal.open'));
dispatch({ type: OPEN_ENGAGEMENT_MODAL });
};
}
/
Closes the engagement metrics modal by dispatching a Redux action.
/
export function closeEngagementModal() {
return (dispatch: IStore['dispatch']) => {
sendAnalytics(createToolbarEvent('engagement.metrics.modal.close'));
dispatch({ type: CLOSE_ENGAGEMENT_MODAL });
};
}
/
Updates the metrics data in the store.
/
export const updateMetricsData = (metricsData: IMetricData[]): IEngagementMetricsAction => {
return {
type: UPDATE_METRICS_DATA,
metricsData
};
};


---

### 2. Create a Modal Container Component

**Objective:** Implement a container that listens to the Redux state and conditionally renders the modal.

_Create a new container component:_
typescript
// File: react/features/engagement-metrics/EngagementMetricsModalContainer.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IReduxState } from '../app/types';
import EngagementMetricsModal from './components/EngagementMetricsModal';
import { closeEngagementModal } from './actions';
const EngagementMetricsModalContainer: React.FC = () => {
const modalOpen = useSelector(
(state: IReduxState) => state['features/engagement-metrics'].modalOpen
);
const dispatch = useDispatch();
if (!modalOpen) {
return null;
}
return (
<EngagementMetricsModal onClose={() => dispatch(closeEngagementModal())} />
);
};
export default EngagementMetricsModalContainer;


**Integration Note:**  
Ensure that this container is mounted within your global application layout or main dialog container so that it continuously listens to Redux state changes.

---

### 3. Update the Redux Reducer

**Objective:** Ensure the reducer properly manages the modal state consistently using a single property.

_Update the reducer as follows:_
typescript
// File: react/features/engagement-metrics/reducer.ts
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
return { ...state, metricsData: action.metricsData };
default:
return state;
}
}

---

### 4. Update Helper Functions

**Objective:** Ensure helper functions reference the correct state property (`modalOpen`) for visibility.

_Update the helper functions as follows:_
typescript
// File: react/features/engagement-metrics/functions.ts
import { IReduxState } from '../app/types';
import { getFeatureFlag } from '../base/flags/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
interface EngagementMetricsConfig {
enabled?: boolean;
}
/
Retrieves the engagement metrics state.
/
const getEngagementMetricsState = (state: IReduxState) =>
state['features/engagement-metrics'] || { modalOpen: false };
/
Determines whether the engagement metrics feature is enabled.
/
export const isEngagementMetricsEnabled = (state: IReduxState): boolean => {
const { engagementMetrics = {} as EngagementMetricsConfig } = state['features/base/config'];
return Boolean(engagementMetrics.enabled || getFeatureFlag(state, 'engagementMetrics'));
};
/
Indicates whether the engagement metrics modal is currently visible.
/
export const isEngagementMetricsVisible = (state: IReduxState): boolean =>
getEngagementMetricsState(state).modalOpen;
/
Determines if the engagement metrics button should be visible.
The button is shown when the feature is enabled and either the user is a moderator
or the modal is already open.
/
export const isEngagementMetricsButtonVisible = (state: IReduxState): boolean =>
isEngagementMetricsEnabled(state) && (
isLocalParticipantModerator(state) || isEngagementMetricsVisible(state)
);


---

## Summary

- **Redux Actions:** Update `openEngagementModal` and `closeEngagementModal` to dispatch actions that modify the Redux state (specifically the `modalOpen` flag).
- **Modal Container:** Introduce a container component that conditionally renders the modal based on Redux state.
- **Reducer:** Modify the reducer to consistently manage the `modalOpen` property.
- **Helper Functions:** Ensure helper functions correctly reference the Redux state.
- **Global Integration:** Mount the modal container within your application layout to enable dynamic responsiveness to state changes.

Implementing these changes will ensure that the engagement-metrics feature is fully integrated as a Redux-controlled plugin, improving maintainability and adherence to the overall plugin architecture.