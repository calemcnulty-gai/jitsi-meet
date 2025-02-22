import { FacialAnalysis, EmotionAnalysis, EngagementScore, GazeAnalysis } from './types';

/**
 * Calculates an engagement score based on facial, emotion, and gaze analysis.
 *
 * @param facial - Facial analysis results
 * @param emotion - Emotion analysis results
 * @param gaze - Gaze analysis results
 * @param timestamp - Timestamp of the analysis
 * @returns EngagementScore
 */
export function calculateEngagementScore(
    facial: FacialAnalysis,
    emotion: EmotionAnalysis,
    gaze: GazeAnalysis,
    timestamp: number,
): EngagementScore {
    // Calculate eye contact score based on gaze analysis
    const eyeContact = calculateEyeContactScore(gaze);

    // Calculate emotion score based on emotion analysis
    const emotionScore = calculateEmotionScore(emotion);

    // Calculate attention score based on facial landmarks and gaze
    const attention = calculateAttentionScore(facial, gaze);

    // Calculate overall engagement score - weight eye contact and attention more heavily
    const score = (eyeContact * 0.4 + emotionScore * 0.2 + attention * 0.4);

    return {
        score,
        factors: {
            eyeContact,
            emotion: emotionScore,
            attention,
        },
        timestamp,
    };
}

function calculateEyeContactScore(gaze: GazeAnalysis): number {
    if (!gaze.isLookingAtScreen) {
        return 0;
    }

    // Scale the confidence by how centered the gaze is
    const gazeDeviation = Math.sqrt(Math.pow(gaze.gazeVector.x, 2)
        + Math.pow(gaze.gazeVector.y, 2),);

    return Math.max(0, 1 - gazeDeviation) * gaze.confidence;
}

function calculateEmotionScore(emotion: EmotionAnalysis): number {
    // Weight emotions based on engagement level:
    // - happy: strongly engaged (1.2x)
    // - angry: engaged (1.0x)
    // - surprised: engaged (0.8x)
    // - sad: weakly engaged (0.4x)
    // - neutral: disengaged (-0.8x)
    const score = (
        emotion.emotions.happy * 1.2
        + emotion.emotions.angry * 1.0
        + emotion.emotions.surprised * 0.8
        + emotion.emotions.sad * 0.4
        - emotion.emotions.neutral * 0.8
    );

    return Math.max(0, Math.min(1, score));
}

function calculateAttentionScore(facial: FacialAnalysis, gaze: GazeAnalysis): number {
    // Combine facial orientation with gaze direction
    const isForwardFacing = Math.abs(gaze.headPose.yaw) < 30;
    const isLookingAtScreen = gaze.isLookingAtScreen;

    if (!isForwardFacing || !isLookingAtScreen) {
        return 0.5; // Partial attention
    }

    // Weight by confidence
    return gaze.confidence;
}
