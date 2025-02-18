import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import logger from './logger';

// Initialize Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let storage;

try {
    logger.info('Initializing Firebase with config:', {
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket
    });
    
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    logger.info('Firebase initialized successfully');
} catch (error) {
    logger.error('Error initializing Firebase:', error);
    throw error;
}

interface IFramePayload {
    imageData: string;
    meetingId: string;
    participantId: string;
    timestamp: number;
}

/**
 * Uploads a frame to Firebase Storage.
 *
 * @param {IFramePayload} payload - The frame data to upload.
 * @returns {Promise<void>}
 */
export const uploadFrame = async (payload: IFramePayload): Promise<void> => {
    const { participantId, meetingId, timestamp } = payload;
    const framePath = `frames/${meetingId}/${participantId}/${timestamp}.png`;
    
    try {
        logger.debug(`Starting frame upload to ${framePath}`);
        
        // Create a reference to the file location
        const frameRef = ref(storage, framePath);
        logger.debug(`Created storage reference for ${framePath}`);

        // Upload the base64 string
        logger.debug(`Uploading frame data (${payload.imageData.length} bytes)`);
        await uploadString(frameRef, payload.imageData, 'data_url');
        
        logger.info(`Successfully uploaded frame to ${framePath}`);
    } catch (error) {
        logger.error(`Error uploading frame to ${framePath}:`, error);
        throw error;
    }
}; 