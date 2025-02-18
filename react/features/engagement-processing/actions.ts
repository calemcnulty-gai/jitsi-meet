import { IStore } from '../app/types';
import {
    PROCESS_FRAME,
    FRAME_PROCESSED,
    UPDATE_ENGAGEMENT_SCORE,
    CLEAR_PROCESSED_FRAMES,
    CLEAR_ENGAGEMENT_SCORES
} from './actionTypes';
import { IProcessedFrame, IEngagementScore } from './types';
import { processFrameData } from './functions';

/**
 * Initiates frame processing.
 *
 * @param {string} frameId - The ID of the frame to process.
 * @param {string} participantId - The ID of the participant.
 * @param {string} meetingId - The ID of the meeting.
 * @param {string} imageData - The base64 encoded image data.
 * @returns {Function}
 */
export function processFrame(
    frameId: string,
    participantId: string,
    meetingId: string,
    imageData: string
) {
    return async (dispatch: IStore['dispatch']) => {
        dispatch({
            type: PROCESS_FRAME,
            frameId,
            participantId,
            meetingId
        });

        try {
            const processedFrame = await processFrameData(frameId, participantId, meetingId, imageData);
            dispatch(frameProcessed(processedFrame));
        } catch (error) {
            // Error handling is done in processFrameData
        }
    };
}

/**
 * Action when frame processing is complete.
 *
 * @param {IProcessedFrame} processedFrame - The processed frame data.
 * @returns {Object}
 */
export function frameProcessed(processedFrame: IProcessedFrame) {
    return {
        type: FRAME_PROCESSED,
        processedFrame
    };
}

/**
 * Updates engagement score for a participant.
 *
 * @param {string} participantId - The ID of the participant.
 * @param {IEngagementScore} score - The engagement score data.
 * @returns {Object}
 */
export function updateEngagementScore(participantId: string, score: IEngagementScore) {
    return {
        type: UPDATE_ENGAGEMENT_SCORE,
        participantId,
        score
    };
}

/**
 * Clears all processed frames.
 *
 * @returns {Object}
 */
export function clearProcessedFrames() {
    return {
        type: CLEAR_PROCESSED_FRAMES
    };
}

/**
 * Clears all engagement scores.
 *
 * @returns {Object}
 */
export function clearEngagementScores() {
    return {
        type: CLEAR_ENGAGEMENT_SCORES
    };
} 