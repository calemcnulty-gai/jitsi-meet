import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import logger from './logger';

// Get Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate required config
function validateConfig() {
    const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];

    const missingFields = requiredFields.filter(
        field => !firebaseConfig[field as keyof typeof firebaseConfig]
    );

    if (missingFields.length > 0) {
        throw new Error(
            `Missing required Firebase configuration fields: ${missingFields.join(', ')}. ` +
            'Please check your .env file.'
        );
    }
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

/**
 * Uploads a frame to Firebase Storage.
 * 
 * @param meetingId - The ID of the meeting.
 * @param participantId - The ID or email of the participant.
 * @param blob - The image blob to upload.
 * @param timestamp - The timestamp when the frame was captured.
 * @returns Promise that resolves when the upload is complete.
 */
export async function uploadFrame(
    meetingId: string,
    participantId: string,
    blob: Blob,
    timestamp: number
): Promise<void> {
    if (!storage) {
        throw new Error('Firebase Storage not initialized. Call initializeFirebase() first.');
    }

    try {
        // URL encode the participantId (which is actually the display name)
        const encodedParticipantName = encodeURIComponent(participantId);
        
        // Create a unique filename using timestamp and encoded name
        const filename = `frames/${meetingId}/${encodedParticipantName}/${timestamp}.jpg`;
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);

        logger.info(`Successfully uploaded frame to Storage: ${filename}`);
    } catch (error) {
        logger.error('Failed to upload frame:', error);
        throw error;
    }
}

/**
 * Initializes the Firebase service.
 * This should be called when the app starts.
 * 
 * @returns Promise that resolves when Firebase is initialized.
 */
export async function initializeFirebase(): Promise<void> {
    try {
        validateConfig();
        app = initializeApp(firebaseConfig);
        storage = getStorage(app);
        logger.info('Firebase service initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Firebase:', error);
        throw error;
    }
} 