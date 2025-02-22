import { FacialAnalysis, EmotionAnalysis, EngagementScore, GazeAnalysis } from './types';

/**
 * Calculates an engagement score based on facial, emotion, and gaze analysis.
 *
 * @param facial - Facial analysis results
 * @param emotion - Emotion analysis results
 * @param gaze - Gaze analysis results
 * @param timestamp - Timestamp of the analysis
 * @param previousScore - The previous smoothed score
 * @returns EngagementScore
 */
export function calculateEngagementScore(
    facial: FacialAnalysis,
    emotion: EmotionAnalysis,
    gaze: GazeAnalysis,
    timestamp: number,
    previousScore: EngagementScore | null = null
): EngagementScore {
    // Calculate individual scores
    const eyeContact = calculateEyeContactScore(gaze);
    const emotionScore = calculateEmotionScore(emotion);
    const attention = calculateAttentionScore(facial, gaze);

    // Calculate raw score with adjusted weights
    const rawScore = (eyeContact * 0.35 + emotionScore * 0.3 + attention * 0.35);

    // Apply smoothing if we have a previous score
    const smoothedScore = smoothScore(
        rawScore,
        previousScore?.score ?? null
    );

    return {
        score: smoothedScore,
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

/**
 * Smooths engagement scores over time using exponential moving average.
 * @param currentScore - The current raw engagement score
 * @param previousScore - The previous smoothed score
 * @param alpha - Smoothing factor (0-1), lower values mean more smoothing
 */
function smoothScore(currentScore: number, previousScore: number | null, alpha: number = 0.3): number {
    if (previousScore === null) {
        return currentScore;
    }
    return alpha * currentScore + (1 - alpha) * previousScore;
}

function calculateEmotionScore(emotion: EmotionAnalysis): number {
    // Enhanced emotion scoring with context
    const emotionWeights = {
        happy: {
            weight: 1.2,
            threshold: 0.3, // Minimum threshold for considering happiness
            boost: 0.2 // Additional boost if above threshold
        },
        angry: {
            weight: 0.8, // Reduced from 1.0 as anger might indicate frustration
            threshold: 0.4,
            penalty: 0.3 // Penalty if anger is too high
        },
        surprised: {
            weight: 0.9, // Increased as surprise often indicates engagement
            threshold: 0.2,
            boost: 0.1
        },
        sad: {
            weight: 0.3, // Reduced as sadness usually indicates disengagement
            threshold: 0.5,
            penalty: 0.2
        },
        neutral: {
            weight: 0.5, // Adjusted from negative to neutral
            threshold: 0.7,
            penalty: 0.1
        }
    };

    let score = 0;
    let totalWeight = 0;

    // Calculate weighted score with thresholds and modifiers
    Object.entries(emotion.emotions).forEach(([emotionType, value]) => {
        const config = emotionWeights[emotionType as keyof typeof emotionWeights];
        let emotionScore = value * config.weight;

        // Apply threshold effects
        if (value > config.threshold) {
            emotionScore += config.boost || 0;
            emotionScore -= config.penalty || 0;
        }

        score += emotionScore;
        totalWeight += config.weight;
    });

    // Normalize score
    const normalizedScore = score / totalWeight;

    // Apply confidence weighting
    return Math.max(0, Math.min(1, normalizedScore * emotion.confidence));
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
