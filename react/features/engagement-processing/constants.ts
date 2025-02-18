/**
 * Weights for different factors in engagement scoring
 */
export const ENGAGEMENT_WEIGHTS = {
    EMOTION: 0.4,
    EYE_TRACKING: 0.4,
    FACE_PRESENCE: 0.2
};

/**
 * Emotion confidence threshold for considering an emotion detection valid
 */
export const EMOTION_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Eye tracking confidence threshold for considering gaze direction valid
 */
export const EYE_TRACKING_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Time window in milliseconds for aggregating engagement scores
 */
export const AGGREGATION_WINDOW_MS = 60000; // 1 minute

/**
 * Replicate API model identifier for emotion classification
 */
export const EMOTION_MODEL_ID = 'replicate/recognition_v1';

/**
 * Mapping of emotion labels to engagement impact scores (0-1)
 */
export const EMOTION_ENGAGEMENT_MAPPING = {
    happy: 1.0,
    neutral: 0.7,
    surprised: 0.8,
    sad: 0.3,
    fearful: 0.2,
    angry: 0.1,
    disgusted: 0.1
};

/**
 * Maximum angle deviation for considering gaze as engaged
 */
export const MAX_ENGAGED_GAZE_ANGLE = 45; // degrees 