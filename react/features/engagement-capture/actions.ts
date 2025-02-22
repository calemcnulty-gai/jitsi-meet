import { START_FRAME_CAPTURE, FRAME_CAPTURED } from './actionTypes';
import { uploadFrame } from './firebaseService';
import { IStore } from '../app/types';

/**
 * Starts frame capture for a participant.
 *
 * @param {string} participantId - The ID of the participant.
 * @param {string} meetingId - The ID of the meeting.
 * @returns {Object}
 */
export function startFrameCapture(participantId: string, meetingId: string) {
    return {
        type: START_FRAME_CAPTURE,
        participantId,
        meetingId
    };
}

/**
 * Action to handle a captured frame.
 *
 * @param {string} participantId - The ID of the participant.
 * @param {string} meetingId - The ID of the meeting.
 * @param {string} dataUrl - The captured frame as a data URL.
 * @returns {Function}
 */
export function handleFrameCaptured(participantId: string, meetingId: string, dataUrl: string) {
    return async (dispatch: IStore['dispatch']) => {
        const timestamp = Date.now();

        // Dispatch that we captured a frame
        dispatch({
            type: FRAME_CAPTURED,
            participantId,
            meetingId,
            timestamp,
            dataUrl
        });

        // Upload the frame
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            await uploadFrame(meetingId, participantId, blob, timestamp);
        } catch (error) {
            // Error is already logged in firebaseService
        }
    };
} 