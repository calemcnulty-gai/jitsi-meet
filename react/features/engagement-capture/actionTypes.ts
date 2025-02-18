/**
 * Redux action type dispatched to start frame capture.
 *
 * {
 *     type: START_FRAME_CAPTURE,
 *     participantId: string,
 *     meetingId: string
 * }
 */
export const START_FRAME_CAPTURE = 'START_FRAME_CAPTURE';

/**
 * Redux action type dispatched when a frame is captured.
 *
 * {
 *     type: FRAME_CAPTURED,
 *     participantId: string,
 *     meetingId: string,
 *     timestamp: number,
 *     dataUrl: string
 * }
 */
export const FRAME_CAPTURED = 'FRAME_CAPTURED'; 