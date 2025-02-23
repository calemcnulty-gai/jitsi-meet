# Participant Highlighting in Jitsi Meet

This document describes how to customize participant ordering and styling in the Jitsi Meet filmstrip. These modifications allow you to:
- Bring specific participants to the top of the filmstrip
- Add custom styling to their thumbnail
- Display custom indicators or overlays
- Add emoticons or other visual elements

## Implementation Overview

The implementation requires modifications to several key components:
1. Participant ordering logic
2. Thumbnail styling
3. Custom indicators
4. Integration with Jitsi's existing components

## 1. Participant Identification

First, create a utility function to identify special participants:

```typescript
// src/features/filmstrip/functions.web.ts

/**
 * Determines if a participant should receive special treatment
 * @param participantId - The ID of the participant to check
 * @returns boolean - True if the participant should be highlighted
 */
export function isSpecialParticipant(participantId: string) {
    // Implement your logic to identify special participants
    // Examples:
    // - Check against a list of IDs
    // - Check participant properties
    // - Check participant roles
    return participantId === 'special-participant-id';
}
```

## 2. Custom Participant Ordering

Extend the remote participants update function to prioritize special participants:

```typescript
// src/features/filmstrip/functions.web.ts

import { IStore } from '../app/types';
import { setRemoteParticipants } from './actions';

/**
 * Updates the remote participants list with custom ordering
 * @param store - The Redux store
 */
export function updateRemoteParticipantsWithPriority(store: IStore) {
    const state = store.getState();
    const { sortedRemoteParticipants } = state['features/base/participants'];
    
    // Create new ordering with special participants first
    const reorderedParticipants = Array.from(sortedRemoteParticipants);
    
    // Find and move special participants to the start
    const specialParticipants = [];
    const regularParticipants = reorderedParticipants.filter(p => {
        if (isSpecialParticipant(p[0])) {
            specialParticipants.push(p);
            return false;
        }
        return true;
    });
    
    // Combine arrays with special participants first
    const finalOrder = [...specialParticipants, ...regularParticipants];
    
    store.dispatch(setRemoteParticipants(finalOrder));
}
```

## 3. Custom Styling

Add custom CSS styles for special participants:

```scss
// css/filmstrip/_special_participants.scss

.special-participant-thumbnail {
    // Custom border
    border: 2px solid gold !important;
    
    // Optional: Add a subtle glow effect
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    
    // Optional: Custom background
    background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4));
}

.special-participant-emoticon {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 3;
    font-size: 24px;
    
    // Optional: Add animation
    animation: float 2s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.special-participant-indicator {
    background-color: rgba(0, 0, 0, .7);
    padding: 4px;
    border-radius: 4px;
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 3;
}
```

## 4. Custom Thumbnail Component

Extend the Thumbnail component to include custom elements:

```typescript
// src/features/filmstrip/components/web/SpecialThumbnail.tsx

import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Thumbnail from './Thumbnail';

const useStyles = makeStyles()(() => ({
    specialIndicator: {
        backgroundColor: 'rgba(0, 0, 0, .7)',
        padding: '4px',
        zIndex: 3,
        display: 'inline-block',
        borderRadius: '4px',
        boxSizing: 'border-box'
    }
}));

interface IProps extends IThumbnailProps {
    isSpecial: boolean;
    specialEmoticon?: string;
    specialIndicatorContent?: React.ReactNode;
}

const SpecialThumbnail: React.FC<IProps> = (props) => {
    const { isSpecial, specialEmoticon, specialIndicatorContent, ...thumbnailProps } = props;
    const { classes: styles } = useStyles();
    
    if (!isSpecial) {
        return <Thumbnail {...thumbnailProps} />;
    }
    
    return (
        <div className="special-participant-container">
            <Thumbnail
                {...thumbnailProps}
                className={`${thumbnailProps.className} special-participant-thumbnail`}
            />
            {specialEmoticon && (
                <div className="special-participant-emoticon">
                    {specialEmoticon}
                </div>
            )}
            {specialIndicatorContent && (
                <div className={styles.specialIndicator}>
                    {specialIndicatorContent}
                </div>
            )}
        </div>
    );
};

export default SpecialThumbnail;
```

## 5. Custom Indicator Component

Create a custom indicator component:

```typescript
// src/features/filmstrip/components/web/SpecialIndicator.tsx

import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { isSpecialParticipant } from '../../functions.web';
import BaseIndicator from './BaseIndicator';

const useStyles = makeStyles()(() => ({
    specialIndicator: {
        backgroundColor: 'rgba(0, 0, 0, .7)',
        padding: '4px',
        zIndex: 3,
        display: 'inline-block',
        borderRadius: '4px'
    }
}));

interface IProps {
    participantId: string;
    icon?: React.ComponentType;
    tooltipKey?: string;
}

const SpecialIndicator: React.FC<IProps> = ({
    participantId,
    icon,
    tooltipKey = 'specialParticipant'
}) => {
    const { classes: styles } = useStyles();
    
    if (!isSpecialParticipant(participantId)) {
        return null;
    }
    
    return (
        <div className={styles.specialIndicator}>
            <BaseIndicator
                icon={icon}
                iconSize="16px"
                tooltipKey={tooltipKey}
                tooltipPosition="right" />
        </div>
    );
};

export default SpecialIndicator;
```

## 6. Integration

To integrate these components:

1. Add the custom styles to your main SCSS file:
```scss
@import 'filmstrip/special_participants';
```

2. Modify the Filmstrip component to use SpecialThumbnail:
```typescript
// src/features/filmstrip/components/web/Filmstrip.tsx

import SpecialThumbnail from './SpecialThumbnail';

// In the render method:
{participants.map(participant => (
    <SpecialThumbnail
        key={participant.id}
        participantId={participant.id}
        isSpecial={isSpecialParticipant(participant.id)}
        specialEmoticon="👑"
        specialIndicatorContent={<span>VIP</span>}
        {...otherProps}
    />
))}
```

3. Add the custom indicator to ThumbnailTopIndicators:
```typescript
// src/features/filmstrip/components/web/ThumbnailTopIndicators.tsx

import SpecialIndicator from './SpecialIndicator';

// In the component:
<div className={styles.container}>
    <SpecialIndicator participantId={participantId} />
    {/* Other indicators */}
</div>
```

## Configuration

You can make the special participant functionality configurable through Jitsi's config:

```javascript
// interface_config.js or config.js
config = {
    // Enable special participant features
    enableSpecialParticipants: true,
    
    // Configure special participant IDs
    specialParticipants: {
        ids: ['special-id-1', 'special-id-2'],
        roles: ['moderator'],
        emoticon: '👑',
        indicatorText: 'VIP'
    }
};
```

Then update the `isSpecialParticipant` function to use this configuration:

```typescript
export function isSpecialParticipant(participantId: string) {
    const state = APP.store.getState();
    const config = state['features/base/config'];
    
    if (!config.enableSpecialParticipants) {
        return false;
    }
    
    const participant = getParticipantById(state, participantId);
    
    return (
        config.specialParticipants.ids.includes(participantId) ||
        config.specialParticipants.roles.includes(participant?.role)
    );
}
```

## Notes

1. These modifications require rebuilding the Jitsi Meet application
2. Test thoroughly in different layouts (tile view, filmstrip view)
3. Consider performance implications when identifying special participants
4. Ensure the custom styling works well with Jitsi's existing themes
5. Consider accessibility when adding custom indicators or emoticons 