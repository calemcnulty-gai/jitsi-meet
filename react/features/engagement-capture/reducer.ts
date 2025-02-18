import ReducerRegistry from '../base/redux/ReducerRegistry';
import { START_FRAME_CAPTURE, FRAME_CAPTURED } from './actionTypes';

export interface IEngagementCaptureState {
    activeCaptures: {
        [participantId: string]: {
            meetingId: string;
            lastCaptureTime?: number;
        };
    };
}

const DEFAULT_STATE = {
    activeCaptures: {}
};

ReducerRegistry.register<IEngagementCaptureState>('features/engagement-capture', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case START_FRAME_CAPTURE:
            return {
                ...state,
                activeCaptures: {
                    ...state.activeCaptures,
                    [action.participantId]: {
                        meetingId: action.meetingId
                    }
                }
            };

        case FRAME_CAPTURED:
            return {
                ...state,
                activeCaptures: {
                    ...state.activeCaptures,
                    [action.participantId]: {
                        ...state.activeCaptures[action.participantId],
                        lastCaptureTime: action.timestamp
                    }
                }
            };

        default:
            return state;
    }
}); 