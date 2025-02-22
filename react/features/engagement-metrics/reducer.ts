import { AnyAction } from 'redux';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import PersistenceRegistry from '../base/redux/PersistenceRegistry';

import {
    SET_ENGAGEMENT_METRICS_OPEN,
    OPEN_ENGAGEMENT_MODAL,
    CLOSE_ENGAGEMENT_MODAL,
    UPDATE_METRICS_DATA
} from './actionTypes';

interface IFacialAnalysis {
    landmarks: {
        leftEye: { x: number; y: number };
        rightEye: { x: number; y: number };
        nose: { x: number; y: number };
        leftMouth: { x: number; y: number };
        rightMouth: { x: number; y: number };
    };
    headPose: {
        roll: number;
        pitch: number;
        yaw: number;
    };
    eyesOpen: boolean;
}

interface IEmotionAnalysis {
    emotions: {
        happy: number;
        sad: number;
        angry: number;
        surprised: number;
        neutral: number;
    };
    confidence: number;
}

interface IGazeAnalysis {
    isLookingAtScreen: boolean;
    confidence: number;
    gazeVector: {
        x: number;
        y: number;
        z: number;
    };
    headPose: {
        pitch: number;
        yaw: number;
        roll: number;
    };
}

interface IAnalysis {
    facial: IFacialAnalysis;
    emotion: IEmotionAnalysis;
    gaze: IGazeAnalysis;
}

interface IEngagementScore {
    score: number;
    factors: {
        eyeContact: number;
        emotion: number;
        attention: number;
    };
    timestamp: number;
}

export interface IMetricData {
    timestamp: number;
    processedAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    score: IEngagementScore;
    participantId: string;
    analysis: IAnalysis;
    storagePath: string;
}

/**
 * The interface for the engagement metrics state.
 */
export interface IEngagementMetricsState {
    /**
     * The indicator which determines whether the engagement metrics panel is open.
     *
     * @type {boolean}
     */
    isOpen: boolean;

    /**
     * The indicator which determines whether the engagement metrics modal is open.
     *
     * @type {boolean}
     */
    modalOpen: boolean;

    metricsData: IMetricData[];
}

/**
 * The default state for the engagement metrics feature.
 */
const DEFAULT_STATE: IEngagementMetricsState = {
    isOpen: false,
    modalOpen: false,
    metricsData: []
};

/**
 * The interface for engagement metrics actions.
 */
export interface IEngagementMetricsAction extends AnyAction {
    /**
     * The type of the action.
     */
    type: string;

    /**
     * The value for the isOpen flag.
     */
    isOpen?: boolean;

    metricsData?: IMetricData[];
}

// Register the redux store
const STORE_NAME = 'features/engagement-metrics';

// Register the feature with persistence
PersistenceRegistry.register(STORE_NAME);

/**
 * Reduces redux actions for the engagement metrics feature.
 */
ReducerRegistry.register<IEngagementMetricsState>(
    STORE_NAME,
    (state = DEFAULT_STATE, action: IEngagementMetricsAction) => {
        switch (action.type) {
        case SET_ENGAGEMENT_METRICS_OPEN:
            return {
                ...state,
                isOpen: Boolean(action.isOpen)
            };

        case OPEN_ENGAGEMENT_MODAL:
            return {
                ...state,
                modalOpen: true
            };

        case CLOSE_ENGAGEMENT_MODAL:
            return {
                ...state,
                modalOpen: false
            };

        case UPDATE_METRICS_DATA:
            return {
                ...state,
                metricsData: action.metricsData || []
            };

        default:
            return state;
        }
    }); 