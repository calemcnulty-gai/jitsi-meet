import { getLogger } from '../base/logging/functions';
import { uploadFrame } from './firebase-service';

const logger = getLogger('features/engagement-capture/frame-capture-service');

const CAPTURE_INTERVAL = 30000; // 30 seconds
const activeCaptures = new Map();

/**
 * Captures a frame from a video track and uploads it.
 * 
 * @param track - The JitsiTrack to capture from
 * @param participantId - The participant ID
 * @param meetingId - The meeting ID
 */
export function captureVideoFrame(track: any, participantId: string, meetingId: string) {
    // Clean up any existing capture for this participant
    if (activeCaptures.has(participantId)) {
        clearInterval(activeCaptures.get(participantId));
    }

    // Get the video element from the track
    const videoElement = track.getOriginalStream()
        .getVideoTracks()[0]
        .getSettings();

    if (!videoElement) {
        logger.error('No video element found for track');
        return;
    }

    // Create a canvas to capture frames
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
        logger.error('Could not get canvas context');
        return;
    }

    // Set up periodic capture
    const captureInterval = setInterval(() => {
        try {
            canvas.width = videoElement.width;
            canvas.height = videoElement.height;
            context.drawImage(videoElement, 0, 0);
            
            const frame = canvas.toDataURL('image/jpeg', 0.8);
            uploadFrame({
                imageData: frame,
                participantId,
                meetingId,
                timestamp: Date.now()
            });
        } catch (error) {
            logger.error('Error capturing frame:', error);
        }
    }, CAPTURE_INTERVAL);

    // Store the interval for cleanup
    activeCaptures.set(participantId, captureInterval);

    // Clean up when track is disposed
    track.on('track.stopped', () => {
        if (activeCaptures.has(participantId)) {
            clearInterval(activeCaptures.get(participantId));
            activeCaptures.delete(participantId);
        }
    });
} 