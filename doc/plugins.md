# Jitsi Meet Plugin Development Guide

## Overview
This guide covers how to create plugins for the modern web-based Jitsi Meet platform using React, TypeScript, and Redux.

## Architecture
Jitsi Meet uses a modular architecture with the following key components:
- React for UI components
- Redux for state management
- TypeScript for type safety
- Middleware for feature integration
- External API for third-party integration

## Plugin Types

### 1. React Feature Plugins
These are the most common type of plugins, integrated directly into the Jitsi Meet codebase.

#### Directory Structure
```
react/features/my-feature/
├── components/           # React components
│   ├── MyComponent.tsx
│   └── styles.ts
├── actions.ts           # Redux actions
├── actionTypes.ts       # Action type constants
├── middleware.ts        # Redux middleware
├── reducer.ts          # Redux reducer
└── functions.ts        # Utility functions
```

#### Required Files

1. **actions.ts**
```typescript
import { IStore } from '../app/types';
import { MY_FEATURE_ACTION } from './actionTypes';

export function myFeatureAction(data: any) {
    return {
        type: MY_FEATURE_ACTION,
        data
    };
}
```

2. **actionTypes.ts**
```typescript
/**
 * Action type for my feature.
 */
export const MY_FEATURE_ACTION = 'MY_FEATURE_ACTION';
```

3. **reducer.ts**
```typescript
import { AnyAction } from 'redux';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { MY_FEATURE_ACTION } from './actionTypes';

export interface IMyFeatureState {
    data: any;
}

const DEFAULT_STATE = {
    data: null
};

ReducerRegistry.register<IMyFeatureState>(
    'features/my-feature',
    (state = DEFAULT_STATE, action: AnyAction) => {
        switch (action.type) {
            case MY_FEATURE_ACTION:
                return {
                    ...state,
                    data: action.data
                };
            default:
                return state;
        }
    }
);
```

4. **middleware.ts**
```typescript
import { AnyAction } from 'redux';
import { IStore } from '../app/types';
import { MiddlewareNext } from '../base/redux/MiddlewareRegistry';
import { MY_FEATURE_ACTION } from './actionTypes';

export function createMyFeatureMiddleware(store: IStore) {
    return (next: MiddlewareNext) => (action: AnyAction) => {
        switch (action.type) {
            case MY_FEATURE_ACTION:
                // Handle action
                break;
        }

        return next(action);
    };
}
```

### 2. External API Plugins
These plugins integrate with Jitsi Meet from external applications.

```typescript
import { JitsiMeetExternalAPI } from '@jitsi/js-utils/jitsi-meet-external-api';

const domain = 'meet.jit.si';
const options = {
    roomName: 'MyRoom',
    width: 700,
    height: 700,
    parentNode: document.querySelector('#meet'),
    lang: 'en'
};

const api = new JitsiMeetExternalAPI(domain, options);

// Listen for events
api.addEventListener('participantJoined', (data) => {
    console.log('Participant joined:', data);
});

// Execute commands
api.executeCommand('toggleAudio');
```

### 3. React SDK Plugins
These plugins use the official React SDK for integration.

```typescript
import { JitsiMeeting } from '@jitsi/react-sdk';
import React from 'react';

const MyJitsiComponent: React.FC = () => {
    return (
        <JitsiMeeting
            roomName="MyRoom"
            configOverwrite={{
                startWithAudioMuted: true,
                disableModeratorIndicator: true,
                startScreenSharing: true,
                enableEmailInStats: false
            }}
            interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
            }}
            getIFrameRef={(iframeRef) => { iframeRef.style.height = '400px'; }}
        />
    );
};
```

## Best Practices

1. **State Management**
   - Use Redux for global state
   - Keep component state local when possible
   - Use TypeScript interfaces for type safety

2. **Component Design**
   - Create reusable components
   - Follow React hooks best practices
   - Use functional components over class components

3. **Performance**
   - Implement proper memoization
   - Avoid unnecessary re-renders
   - Use lazy loading for large components

4. **Error Handling**
   - Implement proper error boundaries
   - Log errors appropriately
   - Provide user-friendly error messages

5. **Testing**
   - Write unit tests for components
   - Test Redux actions and reducers
   - Implement integration tests

## Integration Steps

1. Create your feature directory in `react/features/`
2. Implement required files (actions, reducer, middleware)
3. Register your reducer with ReducerRegistry
4. Add your middleware to MiddlewareRegistry
5. Create and export your React components
6. Import and use your feature in the main application

## Common Pitfalls

1. Not handling cleanup in useEffect
2. Improper TypeScript typing
3. Redux state mutation
4. Missing error handling
5. Poor performance optimization

## Resources

- [Jitsi Meet GitHub Repository](https://github.com/jitsi/jitsi-meet)
- [Jitsi Meet External API Documentation](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [React SDK Documentation](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-react-sdk)

## References

1. [Jitsi Meet Handbook](https://jitsi.github.io/handbook/)
2. [Developer Guide - Web](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-web-jitsi-meet/)
3. [Developer Guide - lib-jitsi-meet API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-ljm-api)
4. [Developer Guide - IFrame API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/)
5. [Architecture Overview](https://github.com/jitsi/handbook/blob/master/docs/architecture.md)
6. [Redux Integration Guide](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-redux)
7. [Mobile Development Guide](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-mobile)
8. [React SDK Guide](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-react-sdk)
9. [Server-side Components](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-manual)
10. [Configuration Guide](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration)