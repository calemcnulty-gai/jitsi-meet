import logger from './logger';
import { uploadFrame } from './firebaseService';

interface CaptureSession {
    imageCapture: ImageCapture;
    intervalId: NodeJS.Timeout;
}

// Track active capture sessions to allow proper cleanup
const activeSessions = new Map<string, CaptureSession>();

// Default capture interval in milliseconds (3 seconds)
const DEFAULT_CAPTURE_INTERVAL = 3000;

// Minimum allowed interval between captures (2 seconds)
const MIN_CAPTURE_INTERVAL = 2000;

// Maximum number of concurrent uploads
const MAX_CONCURRENT_UPLOADS = 3;

// Track pending uploads to prevent overwhelming Firebase
let pendingUploads = 0;

/**
 * Creates an ImageCapture instance from a JitsiTrack's video stream.
 * 
 * @param jitsiTrack - The JitsiTrack instance containing the video stream.
 * @returns ImageCapture instance or null if creation fails.
 */
function createImageCapture(jitsiTrack: any): ImageCapture | null {
    try {
        const stream = jitsiTrack.getOriginalStream();
        const videoTrack = stream.getVideoTracks()[0];
        
        if (!videoTrack) {
            logger.error('No video track found in stream');
            return null;
        }

        return new ImageCapture(videoTrack);
    } catch (error) {
        logger.error('Failed to create ImageCapture:', error);
        return null;
    }
}

/**
 * Captures a single frame from the video stream and processes it.
 * 
 * @param imageCapture - The ImageCapture instance to use.
 * @param participantId - The ID of the participant whose frame is being captured.
 * @param room - The room name where the capture is taking place.
 */
async function captureAndProcessFrame(
    imageCapture: ImageCapture,
    participantId: string,
    room: string
): Promise<void> {
    // Skip capture if too many pending uploads
    if (pendingUploads >= MAX_CONCURRENT_UPLOADS) {
        logger.warn('Too many pending uploads, skipping frame capture');
        return;
    }

    try {
        pendingUploads++;
        
        // Grab a frame from the video stream
        const bitmap = await imageCapture.grabFrame();
        
        // Create a canvas to convert the frame to the desired format
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Draw the frame on the canvas
        ctx.drawImage(bitmap, 0, 0);

        // Convert to blob with JPEG encoding
        const blob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: 0.8
        });

        // Upload the frame to Firebase Storage
        const timestamp = Date.now();
        await uploadFrame(room, participantId, blob, timestamp);
        logger.info(`Captured and uploaded frame for participant ${participantId} in room ${room}`);

        // Clean up
        bitmap.close();
    } catch (error) {
        logger.error('Frame capture failed:', error);
        
        // If we get an error, stop the capture session
        stopVideoFrameCapture(participantId);
    } finally {
        pendingUploads--;
    }
}

/**
 * Starts capturing video frames from a participant's video track.
 * 
 * @param jitsiTrack - The JitsiTrack instance to capture frames from.
 * @param participantId - The ID of the participant whose frames are being captured.
 * @param room - The room name where the capture is taking place.
 * @param interval - Optional interval between captures in milliseconds.
 */
export function captureVideoFrame(
    jitsiTrack: any,
    participantId: string,
    room: string,
    interval: number = DEFAULT_CAPTURE_INTERVAL
): void {
    // Enforce minimum interval
    const safeInterval = Math.max(interval, MIN_CAPTURE_INTERVAL);
    if (safeInterval !== interval) {
        logger.warn(`Requested interval ${interval}ms is too low, using ${safeInterval}ms instead`);
    }

    // Don't create duplicate capture sessions
    if (activeSessions.has(participantId)) {
        logger.info(`Capture session already exists for participant ${participantId}`);
        return;
    }

    const imageCapture = createImageCapture(jitsiTrack);
    if (!imageCapture) {
        logger.error(`Failed to create ImageCapture for participant ${participantId}`);
        return;
    }

    // Start periodic capture
    const intervalId = setInterval(
        () => captureAndProcessFrame(imageCapture, participantId, room),
        safeInterval
    );

    // Store the capture session
    activeSessions.set(participantId, { imageCapture, intervalId });
    
    // Capture first frame immediately
    captureAndProcessFrame(imageCapture, participantId, room);

    logger.info(`Started frame capture for participant ${participantId} in room ${room}`);
}

/**
 * Stops capturing video frames for a participant.
 * 
 * @param participantId - The ID of the participant whose capture should be stopped.
 */
export function stopVideoFrameCapture(participantId: string): void {
    const session = activeSessions.get(participantId);
    if (!session) {
        return;
    }

    clearInterval(session.intervalId);
    activeSessions.delete(participantId);
    
    logger.info(`Stopped frame capture for participant ${participantId}`);
}

/**
 * Stops all active capture sessions.
 */
export function stopAllCaptures(): void {
    for (const participantId of activeSessions.keys()) {
        stopVideoFrameCapture(participantId);
    }
    
    logger.info('Stopped all frame captures');
} 