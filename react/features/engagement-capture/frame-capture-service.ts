import { getLogger } from '../base/logging/functions';
import { uploadFrame } from './firebase-service';
import logger from './logger';

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
    logger.info(`Initializing video capture for participant ${participantId}`);

    // Clean up any existing capture for this participant
    if (activeCaptures.has(participantId)) {
        logger.info(`Cleaning up existing capture for participant ${participantId}`);
        clearInterval(activeCaptures.get(participantId));
        activeCaptures.delete(participantId);
    }

    // Get the video element from the track
    logger.debug(`Getting stream for participant ${participantId}`);
    const stream = track.getOriginalStream();
    if (!stream) {
        logger.error(`Failed to get stream for participant ${participantId}`);
        return;
    }
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    logger.debug(`Created video element for participant ${participantId}`);
    
    // Wait for video to be ready
    video.onloadedmetadata = () => {
        logger.info(`Video element ready for participant ${participantId}, size: ${video.videoWidth}x${video.videoHeight}`);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
            logger.error(`Could not get canvas context for participant ${participantId}`);
            return;
        }

        logger.debug(`Canvas initialized for participant ${participantId}`);

        // Set initial canvas size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Set up periodic capture
        logger.info(`Starting periodic capture every ${CAPTURE_INTERVAL}ms for participant ${participantId}`);
        const captureInterval = setInterval(() => {
            try {
                logger.debug(`Attempting frame capture for participant ${participantId}`);
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                
                const frame = canvas.toDataURL('image/jpeg', 0.8);
                logger.debug(`Frame captured for participant ${participantId}, size: ${canvas.width}x${canvas.height}`);
                
                uploadFrame({
                    imageData: frame,
                    participantId,
                    meetingId,
                    timestamp: Date.now()
                });
                logger.info(`Successfully captured and uploaded frame for participant ${participantId}`);
            } catch (error) {
                logger.error(`Error capturing frame for participant ${participantId}:`, error);
            }
        }, CAPTURE_INTERVAL);

        // Store the interval for cleanup
        activeCaptures.set(participantId, captureInterval);
        logger.debug(`Stored capture interval for participant ${participantId}`);

        // Clean up when track is disposed
        track.on('track.stopped', () => {
            logger.info(`Track stopped for participant ${participantId}, cleaning up`);
            if (activeCaptures.has(participantId)) {
                clearInterval(activeCaptures.get(participantId));
                activeCaptures.delete(participantId);
                logger.debug(`Cleaned up capture interval for participant ${participantId}`);
            }
        });
    };

    video.onerror = (error) => {
        logger.error(`Video element error for participant ${participantId}:`, error);
    };
} 