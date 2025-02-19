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

        // Store the results in Storage
        const resultPath = `results/${filePath}`;
        const resultData = JSON.stringify({
            analysis,
            score,
            timestamp,
            processedAt: new Date().toISOString(),
        }, null, 2);

        await bucket.file(resultPath).save(resultData, {
            contentType: 'application/json',
            metadata: {
                score: score.toString(),
                processedAt: new Date().toISOString(),
            },
        });

        // Extract meeting ID and participant ID from file path
        // Expected format: frames/meeting-id/participant-id/frame-timestamp.jpg
        const [, meetingId, participantId] = filePath.split('/');

        if (!meetingId || !participantId) {
            throw new Error(`Invalid file path format: ${filePath}`);
        }

        // Store results in Firestore
        const analysisRef = db.collection('meetings').doc(meetingId)
            .collection('participants').doc(participantId)
            .collection('analyses');

        // Use timestamp as document ID for efficient time-based queries
        const timeBasedId = `${timestamp}`; // Convert to string for document ID
        await analysisRef.doc(timeBasedId).set({
            timestamp,
            processedAt: new Date(),
            score,
            facial: analysis.facial,
            emotion: analysis.emotion,
            gaze: analysis.gaze,
            storagePath: resultPath,
        });

        // Update aggregate stats in participant document
        const participantRef = db.collection('meetings').doc(meetingId)
            .collection('participants').doc(participantId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(participantRef);
            const data = doc.data() || {
                totalFrames: 0,
                totalScore: 0,
                firstFrame: timestamp,
                lastFrame: timestamp,
                // Add time series metadata for efficient querying
                timeSeriesStart: timestamp,
                timeSeriesEnd: timestamp,
                samplingRate: 0, // Will be calculated
                totalSamples: 0,
            };

            // Calculate approximate sampling rate (in milliseconds)
            const newSamplingRate = data.totalFrames > 0
                ? ((timestamp - data.timeSeriesStart) / data.totalFrames)
                : 0;

            transaction.set(participantRef, {
                totalFrames: data.totalFrames + 1,
                totalScore: data.totalScore + score,
                averageScore: (data.totalScore + score) / (data.totalFrames + 1),
                firstFrame: Math.min(data.firstFrame, timestamp),
                lastFrame: Math.max(data.lastFrame, timestamp),
                timeSeriesStart: Math.min(data.timeSeriesStart, timestamp),
                timeSeriesEnd: Math.max(data.timeSeriesEnd, timestamp),
                samplingRate: newSamplingRate,
                totalSamples: data.totalFrames + 1,
                lastUpdate: new Date(),
            }, { merge: true });
        });

        // Store time-bucketed summaries for longer time ranges
        const minute = Math.floor(timestamp / (60 * 1000)); // 1-minute buckets
        const summaryRef = db.collection('meetings').doc(meetingId)
            .collection('participants').doc(participantId)
            .collection('summaries').doc(`${minute}`);

        await summaryRef.set({
            startTime: minute * 60 * 1000,
            endTime: (minute + 1) * 60 * 1000,
            samples: admin.firestore.FieldValue.increment(1),
            totalScore: admin.firestore.FieldValue.increment(Number(score)),
            averageScore: Number(score), // Will be updated in transaction
            emotions: {
                happy: admin.firestore.FieldValue.increment(
                    analysis.emotion.emotions.happy
                ),
                sad: admin.firestore.FieldValue.increment(
                    analysis.emotion.emotions.sad
                ),
                angry: admin.firestore.FieldValue.increment(
                    analysis.emotion.emotions.angry
                ),
                surprised: admin.firestore.FieldValue.increment(
                    analysis.emotion.emotions.surprised
                ),
                neutral: admin.firestore.FieldValue.increment(analysis.emotion.emotions.neutral),
            },
        }, { merge: true });

        // Update the average score for the minute bucket
        await db.runTransaction(async (transaction) => {
            const summaryDoc = await transaction.get(summaryRef);
            const summaryData = summaryDoc.data();
            if (summaryData) {
                transaction.update(summaryRef, {
                    averageScore: summaryData.totalScore / summaryData.samples,
                });
            }
        });

        logger.info('[processFrame] Successfully processed frame', {
            filePath,
            resultPath,
            score,
            meetingId,
            participantId,
            minute,
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
