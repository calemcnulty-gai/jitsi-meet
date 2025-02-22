import { onObjectFinalized, StorageEvent } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { analyzeImage } from './engagement-capture/human-analysis';
import { calculateEngagementScore } from './engagement-capture/engagement-scoring';
import { validateModelDeployment } from './engagement-capture/deployment-validation';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: 'jitsi-engagement.appspot.com',
    });
}

// Initialize storage and Firestore
const storage = getStorage();
const db = getFirestore();

// Run deployment validation on cold start
try {
    validateModelDeployment();
} catch (error) {
    console.error('❌ Deployment validation failed:', error);
    // We throw here to prevent the function from initializing with missing models
    throw error;
}

// Export the function with v2 configuration
export const processFrame = onObjectFinalized({
    timeoutSeconds: 540,
    memory: '1GiB',
    region: 'us-central1',
}, async (event: StorageEvent) => {
    try {
        // Get the file data
        const filePath = event.data.name;
        const bucketName = event.data.bucket;

        if (!filePath) {
            logger.error('[processFrame] No file path provided');
            return;
        }

        // Process only files in the frames directory
        if (!filePath.startsWith('frames/')) {
            logger.info(
                '[processFrame] Skipping file not in frames directory',
                { filePath }
            );
            return;
        }

        logger.info(
            '[processFrame] Starting frame processing',
            { filePath, bucketName }
        );

        // Get the file contents
        const bucket = storage.bucket(bucketName);
        const [imageBuffer] = await bucket.file(filePath).download();
        const imageData = imageBuffer.toString('base64');

        logger.info('[processFrame] Downloaded image', {
            filePath,
            sizeBytes: imageBuffer.length,
        });

        // Analyze the image
        const analysis = await analyzeImage(imageData);
        logger.info('[processFrame] Completed image analysis', {
            filePath,
            hasFacial: !!analysis.facial,
            hasEmotion: !!analysis.emotion,
            hasGaze: !!analysis.gaze,
        });

        // Calculate engagement score
        const timestamp = Date.now();
        const score = calculateEngagementScore(
            analysis.facial,
            analysis.emotion,
            analysis.gaze,
            timestamp
        );

        logger.info('[processFrame] Calculated engagement score', {
            filePath,
            score,
        });

        // Extract meeting ID and participant ID from file path
        // Expected format: frames/meeting-id/participant-id/frame-timestamp.jpg
        const [, meetingId, encodedParticipantName] = filePath.split('/');

        if (!meetingId || !encodedParticipantName) {
            throw new Error(`Invalid file path format: ${filePath}`);
        }

        // Decode the participant name from the URL encoded format
        const participantId = decodeURIComponent(encodedParticipantName);

        // Store results in Firestore at /meetings/{meetingId}/analyses/{timestamp}
        const analysisRef = db.collection('meetings')
            .doc(meetingId)
            .collection('analyses');

        // Create the analysis document
        const analysisData = {
            timestamp,
            processedAt: new Date(),
            score,
            participantId,
            analysis: {
                facial: analysis.facial,
                emotion: analysis.emotion,
                gaze: analysis.gaze,
            },
            storagePath: filePath,
        };

        // Log the data we're about to write
        logger.info('[processFrame] Writing analysis to Firestore', {
            meetingId,
            participantId,
            analysisData,
        });

        try {
            // Write the analysis data
            await analysisRef.doc(`${participantId}-${timestamp}.json`).set(analysisData);

            logger.info('[processFrame] Successfully wrote analysis to Firestore', {
                meetingId,
                participantId,
                timestamp,
            });
        } catch (error) {
            logger.error('[processFrame] Failed to write analysis to Firestore', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                meetingId,
                participantId,
            });
            throw error;
        }

        // Clean up the original frame from Storage
        await bucket.file(filePath).delete();

        logger.info('[processFrame] Successfully processed frame', {
            filePath,
            score,
            meetingId,
            participantId,
        });
    } catch (error) {
        logger.error('[processFrame] Error processing frame', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            filePath: event.data.name,
        });
        throw error;
    }
});
