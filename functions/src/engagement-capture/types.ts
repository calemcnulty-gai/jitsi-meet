export interface FrameData {
    imageData: string;
    meetingId: string;
    participantId: string;
    timestamp: number;
}

export interface FacialAnalysis {
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

export interface EmotionAnalysis {
    emotions: {
        happy: number;
        sad: number;
        angry: number;
        surprised: number;
        neutral: number;
    };
    confidence: number;
}

export interface EngagementScore {
    score: number;
    factors: {
        eyeContact: number;
        emotion: number;
        attention: number;
    };
    timestamp: number;
}

export interface GazeAnalysis {
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
