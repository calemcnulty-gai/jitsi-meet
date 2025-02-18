import { FaceLandmarks } from '../face-landmarks/types';

export interface IEyeTrackingData {
    leftEye: {
        x: number;
        y: number;
        isOpen: boolean;
        openness: number;
    };
    rightEye: {
        x: number;
        y: number;
        isOpen: boolean;
        openness: number;
    };
    gazeDirection: {
        x: number;
        y: number;
        confidence: number;
    };
}

export interface IEmotionData {
    emotion: string;
    confidence: number;
    timestamp: number;
}

export interface IEngagementScore {
    score: number;
    confidence: number;
    timestamp: number;
    factors: {
        emotionWeight: number;
        eyeTrackingWeight: number;
        facePresenceWeight: number;
    };
}

export interface IProcessedFrame {
    frameId: string;
    participantId: string;
    meetingId: string;
    timestamp: number;
    eyeTracking?: IEyeTrackingData;
    emotion?: IEmotionData;
    faceLandmarks?: FaceLandmarks;
    engagementScore?: IEngagementScore;
}

export interface IEngagementState {
    processedFrames: {
        [frameId: string]: IProcessedFrame;
    };
    aggregateScores: {
        [participantId: string]: {
            [timestamp: number]: IEngagementScore;
        };
    };
} 