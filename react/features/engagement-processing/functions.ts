import { Human } from '@vladmandic/human';
import logger from './logger';
import {
    IProcessedFrame,
    IEyeTrackingData,
    IEmotionData,
    IEngagementScore
} from './types';
import {
    ENGAGEMENT_WEIGHTS,
    EMOTION_CONFIDENCE_THRESHOLD,
    EYE_TRACKING_CONFIDENCE_THRESHOLD,
    EMOTION_ENGAGEMENT_MAPPING,
    MAX_ENGAGED_GAZE_ANGLE
} from './constants';

/**
 * Process eye tracking data from face landmarks.
 *
 * @param {Human} human - The Human library instance.
 * @param {ImageData} imageData - The image data to process.
 * @returns {Promise<IEyeTrackingData | undefined>}
 */
async function processEyeTracking(
    human: Human,
    imageData: ImageData
): Promise<IEyeTrackingData | undefined> {
    try {
        const result = await human.detect(imageData);
        const face = result.face[0];

        if (!face || !face.rotation || !face.mesh) {
            return undefined;
        }

        // Calculate eye openness and gaze direction
        const leftEye = {
            x: face.mesh[362][0],
            y: face.mesh[362][1],
            isOpen: face.mesh[386][1] - face.mesh[374][1] > 0.02,
            openness: face.mesh[386][1] - face.mesh[374][1]
        };

        const rightEye = {
            x: face.mesh[133][0],
            y: face.mesh[133][1],
            isOpen: face.mesh[159][1] - face.mesh[145][1] > 0.02,
            openness: face.mesh[159][1] - face.mesh[145][1]
        };

        const gazeDirection = {
            x: face.rotation.angle.yaw,
            y: face.rotation.angle.pitch,
            confidence: face.rotation.score
        };

        return {
            leftEye,
            rightEye,
            gazeDirection
        };
    } catch (error) {
        logger.error('Error processing eye tracking:', error);
        return undefined;
    }
}

/**
 * Calculate engagement score based on eye tracking data.
 *
 * @param {IEyeTrackingData} eyeTracking - The eye tracking data.
 * @returns {number} - Score between 0 and 1.
 */
function calculateEyeEngagement(eyeTracking: IEyeTrackingData): number {
    if (eyeTracking.gazeDirection.confidence < EYE_TRACKING_CONFIDENCE_THRESHOLD) {
        return 0.5; // Default to neutral if low confidence
    }

    // Check if eyes are open
    const eyesOpen = eyeTracking.leftEye.isOpen && eyeTracking.rightEye.isOpen;
    if (!eyesOpen) {
        return 0;
    }

    // Calculate gaze angle deviation from center
    const gazeDeviation = Math.sqrt(
        Math.pow(eyeTracking.gazeDirection.x, 2) +
        Math.pow(eyeTracking.gazeDirection.y, 2)
    );

    // Convert to engagement score (1 when looking straight, 0 when looking away)
    return Math.max(0, 1 - (gazeDeviation / MAX_ENGAGED_GAZE_ANGLE));
}

/**
 * Calculate engagement score based on emotion.
 *
 * @param {IEmotionData} emotion - The emotion data.
 * @returns {number} - Score between 0 and 1.
 */
function calculateEmotionEngagement(emotion: IEmotionData): number {
    if (emotion.confidence < EMOTION_CONFIDENCE_THRESHOLD) {
        return 0.5; // Default to neutral if low confidence
    }

    return EMOTION_ENGAGEMENT_MAPPING[emotion.emotion] || 0.5;
}

/**
 * Calculate overall engagement score.
 *
 * @param {Object} data - The processed data.
 * @returns {IEngagementScore}
 */
function calculateEngagementScore(data: {
    eyeTracking?: IEyeTrackingData;
    emotion?: IEmotionData;
    hasFace: boolean;
    timestamp: number;
}): IEngagementScore {
    const eyeScore = data.eyeTracking
        ? calculateEyeEngagement(data.eyeTracking)
        : 0.5;
    
    const emotionScore = data.emotion
        ? calculateEmotionEngagement(data.emotion)
        : 0.5;

    const facePresenceScore = data.hasFace ? 1 : 0;

    const score =
        (eyeScore * ENGAGEMENT_WEIGHTS.EYE_TRACKING) +
        (emotionScore * ENGAGEMENT_WEIGHTS.EMOTION) +
        (facePresenceScore * ENGAGEMENT_WEIGHTS.FACE_PRESENCE);

    // Calculate confidence based on individual confidences
    const confidence = data.eyeTracking && data.emotion
        ? (data.eyeTracking.gazeDirection.confidence + data.emotion.confidence) / 2
        : 0.5;

    return {
        score,
        confidence,
        timestamp: data.timestamp,
        factors: {
            eyeTrackingWeight: ENGAGEMENT_WEIGHTS.EYE_TRACKING,
            emotionWeight: ENGAGEMENT_WEIGHTS.EMOTION,
            facePresenceWeight: ENGAGEMENT_WEIGHTS.FACE_PRESENCE
        }
    };
}

/**
 * Process a frame and extract engagement data.
 *
 * @param {string} frameId - The ID of the frame.
 * @param {string} participantId - The ID of the participant.
 * @param {string} meetingId - The ID of the meeting.
 * @param {string} imageData - Base64 encoded image data.
 * @returns {Promise<IProcessedFrame>}
 */
export async function processFrameData(
    frameId: string,
    participantId: string,
    meetingId: string,
    imageData: string
): Promise<IProcessedFrame> {
    try {
        // Initialize Human library
        const human = new Human({
            backend: 'webgl',
            modelBasePath: '/libs/human/models',
            face: {
                enabled: true,
                detector: { enabled: true },
                mesh: { enabled: true },
                iris: { enabled: true },
                emotion: { enabled: true }
            }
        });

        // Convert base64 to ImageData
        const img = new Image();
        img.src = imageData;
        await new Promise(resolve => img.onload = resolve);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Process eye tracking
        const eyeTracking = await processEyeTracking(human, imgData);

        // Process emotion (using face-landmarks data for now)
        const result = await human.detect(imgData);
        const emotion = result.face[0]?.emotion?.[0] ? {
            emotion: result.face[0].emotion[0].emotion,
            confidence: result.face[0].emotion[0].score,
            timestamp: Date.now()
        } : undefined;

        // Calculate engagement score
        const engagementScore = calculateEngagementScore({
            eyeTracking,
            emotion,
            hasFace: result.face.length > 0,
            timestamp: Date.now()
        });

        return {
            frameId,
            participantId,
            meetingId,
            timestamp: Date.now(),
            eyeTracking,
            emotion,
            engagementScore
        };
    } catch (error) {
        logger.error('Error processing frame:', error);
        throw error;
    }
} 