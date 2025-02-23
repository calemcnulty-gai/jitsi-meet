import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import logger from './logger';

/**
 * Type definition for facial analysis data.
 */
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

/**
 * Type definition for emotion analysis data.
 */
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

/**
 * Type definition for gaze analysis data.
 */
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

/**
 * Type definition for the complete analysis data.
 */
interface IAnalysis {
    facial: IFacialAnalysis;
    emotion: IEmotionAnalysis;
    gaze: IGazeAnalysis;
}

/**
 * Type definition for engagement score data.
 */
interface IEngagementScore {
    score: number;
    factors: {
        eyeContact: number;
        emotion: number;
        attention: number;
    };
    timestamp: number;
}

/**
 * Type definition for the complete metric data document.
 */
interface IMetricData {
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
 * Type definition for the metrics data callback.
 */
type MetricsCallback = (data: IMetricData[]) => void;

/**
 * Type definition for the unsubscribe function.
 */
type UnsubscribeFunction = () => void;

/**
 * Subscribes to real-time engagement metrics updates from Firestore.
 *
 * @param {string | { toString(): string }} roomId - The ID of the current room to fetch metrics for.
 * @param {MetricsCallback} callback - Function to be called with updated metrics data.
 * @returns {UnsubscribeFunction} - Function to unsubscribe from Firestore updates.
 * @throws {Error} If roomId is invalid
 */
export function subscribeToEngagementMetrics(
    roomId: string | { toString(): string },
    callback: MetricsCallback
): UnsubscribeFunction {
    if (!roomId) {
        throw new Error('Invalid roomId provided to subscribeToEngagementMetrics');
    }

    const meetingId = document.location.href.split('/').pop() || 'default';
    const db = getFirestore();
    logger.info(`Subscribing to room: ${meetingId}`);

    // Get the analyses collection reference
    const analysesRef = collection(db, 'meetings', meetingId, 'analyses');
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
        query(
            analysesRef,
            where('timestamp', '>=', Date.now() - (5 * 60 * 1000)),
            orderBy('timestamp', 'desc')
        ),
        async (snapshot) => {
            try {
                // Log raw snapshot data
                console.log('Raw Firestore snapshot:', snapshot.docs.map(doc => doc.data()));

                // Convert Firestore documents to our data format
                const metricsData: IMetricData[] = snapshot.docs.map(doc => {
                    const rawData = doc.data();
                    const data = rawData as IMetricData;
                    return data;
                });
                logger.info('Sending metrics data:', metricsData.length, 'data points');
                callback(metricsData);
            } catch (error) {
                logger.error('Error processing metrics:', error);
                callback([]);
            }
        },
        error => {
            logger.error('Firestore subscription error:', error);
            callback([]);
        }
    );

    return unsubscribe;
}

/**
 * Initialize Firebase configuration.
 * This should be called before any other Firebase operations.
 * 
 * @param {Object} config - Firebase configuration object
 * @returns {Promise<void>}
 */
export async function initializeFirebase(config: {
    apiKey: string;
    projectId: string;
    [key: string]: any;
}): Promise<void> {
    if (!getApps().length) {
        try {
            await initializeApp(config);
        } catch (error) {
            logger.error('Error initializing Firebase:', error);
            throw error;
        }
    }
} 