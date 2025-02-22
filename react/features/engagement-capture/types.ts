import { ITrack } from '../base/tracks/types';

/**
 * Extended track interface for engagement capture that includes disposal state
 */
export interface IEngagementTrack extends ITrack {
    disposed?: boolean;
}

/**
 * State for active captures
 */
export interface IActiveCapture {
    meetingId: string;
    lastCaptureTime?: number;
}

/**
 * Frame capture data
 */
export interface IFrameCapture {
    participantId: string;
    meetingId: string;
    timestamp: number;
    dataUrl: string;
} 