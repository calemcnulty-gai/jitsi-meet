import ReducerRegistry from '../base/redux/ReducerRegistry';
import {
    FRAME_PROCESSED,
    UPDATE_ENGAGEMENT_SCORE,
    CLEAR_PROCESSED_FRAMES,
    CLEAR_ENGAGEMENT_SCORES
} from './actionTypes';
import { IEngagementState } from './types';

const DEFAULT_STATE = {
    processedFrames: {},
    aggregateScores: {}
};

export interface IEngagementProcessingState extends IEngagementState {}

ReducerRegistry.register<IEngagementProcessingState>(
    'features/engagement-processing',
    (state = DEFAULT_STATE, action): IEngagementProcessingState => {
        switch (action.type) {
            case FRAME_PROCESSED: {
                const { processedFrame } = action;
                return {
                    ...state,
                    processedFrames: {
                        ...state.processedFrames,
                        [processedFrame.frameId]: processedFrame
                    }
                };
            }

            case UPDATE_ENGAGEMENT_SCORE: {
                const { participantId, score } = action;
                return {
                    ...state,
                    aggregateScores: {
                        ...state.aggregateScores,
                        [participantId]: {
                            ...state.aggregateScores[participantId],
                            [score.timestamp]: score
                        }
                    }
                };
            }

            case CLEAR_PROCESSED_FRAMES:
                return {
                    ...state,
                    processedFrames: {}
                };

            case CLEAR_ENGAGEMENT_SCORES:
                return {
                    ...state,
                    aggregateScores: {}
                };

            default:
                return state;
        }
    }
); 