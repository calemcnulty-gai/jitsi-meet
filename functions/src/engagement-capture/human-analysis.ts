import * as Human from '@vladmandic/human';
import * as path from 'path';
import * as fs from 'fs';
import { FacialAnalysis, EmotionAnalysis } from './types';
import type { GazeAnalysis } from './types';

// Initialize Human with our required models
const modelPath = path.join(__dirname, '..', 'models');
const modelUrl = `file://${modelPath}`;

// Cloud Function Environment Logging
console.log('\n=== Cloud Function Runtime Environment ===');
console.log('Process CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Model path:', modelPath);
console.log('Model URL:', modelUrl);
console.log('Model path exists:', fs.existsSync(modelPath));

// Workspace Structure
console.log('\n=== Workspace Directory Structure ===');
try {
    console.log('Root contents:', fs.readdirSync('/workspace'));
    console.log(
        'node_modules contents:',
        fs.readdirSync('/workspace/node_modules')
    );
    console.log(
        '@vladmandic contents:',
        fs.readdirSync('/workspace/node_modules/@vladmandic')
    );
    console.log(
        'human contents:',
        fs.readdirSync('/workspace/node_modules/@vladmandic/human')
    );
    console.log(
        'Default models location:',
        fs.readdirSync('/workspace/node_modules/@vladmandic/human/models')
    );
} catch (err) {
    console.error('Error reading workspace structure:', err);
}

// Model Path Validation
console.log('\n=== Model Path Validation ===');
console.log('Configured model path:', modelPath);
console.log('Absolute model path:', path.resolve(modelPath));
console.log('Model path exists:', fs.existsSync(modelPath));
console.log(
    'Parent directory exists:',
    fs.existsSync(path.dirname(modelPath))
);
try {
    console.log(
        'Parent directory contents:',
        fs.readdirSync(path.dirname(modelPath))
    );
} catch (err) {
    console.error('Error reading parent directory:', err);
}

// Model Directory Contents
if (fs.existsSync(modelPath)) {
    console.log('\n=== Model Directory Contents ===');
    try {
        const modelFiles = fs.readdirSync(modelPath);
        console.log('Number of files:', modelFiles.length);
        console.log('Files:', modelFiles);

        // Verify specific required models
        const requiredModels = [
            'blazeface.json', 'emotion.json', 'iris.json',
        ];
        console.log('\nRequired models present:');
        requiredModels.forEach((model) => {
            const modelFilePath = path.join(modelPath, model);
            console.log(`- ${model}:`);
            console.log(`  - Exists: ${fs.existsSync(modelFilePath)}`);
            if (fs.existsSync(modelFilePath)) {
                const stats = fs.statSync(modelFilePath);
                console.log(`  - Size: ${stats.size} bytes`);
                console.log(`  - Readable: ${fs.accessSync(
                    modelFilePath,
                    fs.constants.R_OK
                ) === undefined}`);
                console.log(`  - File permissions: ${stats.mode}`);
                // Try to read first few bytes to verify access
                try {
                    const fd = fs.openSync(modelFilePath, 'r');
                    const buffer = Buffer.alloc(64);
                    fs.readSync(fd, buffer, 0, 64, 0);
                    fs.closeSync(fd);
                    console.log('  - First 64 bytes readable: true');
                } catch (err) {
                    console.error('  - File read error:', err);
                }
            }
        });
    } catch (err) {
        console.error('Error inspecting model directory:', err);
    }
} else {
    console.error('\n=== ERROR: Model Directory Not Found ===');
    console.error('Expected path:', modelPath);
    console.error('Parent exists:', fs.existsSync(path.dirname(modelPath)));
    if (fs.existsSync(path.dirname(modelPath))) {
        console.error('Parent contents:', fs.readdirSync(path.dirname(modelPath)));
    }
}

// Human configuration with local model loading
const config = {
    modelBasePath: modelUrl,
    backend: 'tensorflow' as const,
    filter: {
        enabled: true,
        equalization: false,
        width: 512,
    },
    face: {
        enabled: true,
        detector: {
            rotation: true,
            return: true,
            maxDetected: 1,
            minConfidence: 0.5,
        },
        mesh: { enabled: true },
        iris: { enabled: true },
        description: { enabled: true },
        emotion: {
            enabled: true,
            minConfidence: 0.2,
        },
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: false },
    async: true,
    warmup: 'none' as const,
    cacheModels: true,
    deallocate: true,
};

console.log('\n=== Human Configuration ===');
console.log('Configuration:', JSON.stringify(config, null, 2));

console.log('\n=== Initializing Human ===');
const human = new Human.Human(config);

// Log Human version and environment
console.log('\n=== Human Library Information ===');
console.log('Human version:', human.version);
console.log('TFJS version:', human.tf.version.tfjs);
console.log('Backend:', human.tf.getBackend());

// Add model loading validation
console.log('\n=== Model Loading Validation ===');
human.load().then(() => {
    console.log('Models loaded successfully');
    console.log('Loaded models:', human.models.loaded());
    console.log('Model stats:', human.models.stats());
}).catch((error) => {
    console.error('Error loading models:', error);
    console.error('Model loading state:', human.models.loaded());
});

interface HumanAnalysisResult {
    facial: FacialAnalysis;
    emotion: EmotionAnalysis;
    gaze: GazeAnalysis;
}

/**
 * Analyzes an image using Human library to extract facial features, emotions, and gaze.
 *
 * @param imageData - Base64 encoded image data
 * @returns Promise<HumanAnalysisResult>
 */
export async function analyzeImage(imageData: string): Promise<HumanAnalysisResult> {
    try {
        // Convert base64 to buffer and create image
        const buffer = Buffer.from(imageData, 'base64');
        const tensor = human.tf.node.decodeImage(buffer);

        // Run detection
        const result = await human.detect(tensor);

        // Cleanup tensor
        human.tf.dispose(tensor);

        if (!result.face || result.face.length === 0) {
            throw new Error('No face detected in the image');
        }

        const face = result.face[0];

        // Extract facial analysis
        const facial: FacialAnalysis = {
            landmarks: {
                leftEye: extractEyePosition(face.mesh, 'left'),
                rightEye: extractEyePosition(face.mesh, 'right'),
                nose: extractNosePosition(face.mesh),
                leftMouth: extractMouthPosition(face.mesh, 'left'),
                rightMouth: extractMouthPosition(face.mesh, 'right'),
            },
            headPose: {
                roll: face.rotation?.angle?.roll || 0,
                pitch: face.rotation?.angle?.pitch || 0,
                yaw: face.rotation?.angle?.yaw || 0,
            },
            eyesOpen: face.mesh ? isEyesOpen(face.mesh) : false,
        };

        // Extract emotion analysis
        const emotions = face.emotion || [];
        const dominantEmotion = emotions.reduce(
            (prev, current) => (current.score > prev.score) ? current : prev,
            { score: 0, emotion: 'neutral' as Human.Emotion }
        );

        const emotion: EmotionAnalysis = {
            emotions: {
                happy: getEmotionScore(emotions, 'happy'),
                sad: getEmotionScore(emotions, 'sad'),
                angry: getEmotionScore(emotions, 'angry'),
                surprised: getEmotionScore(emotions, 'surprise'),
                neutral: getEmotionScore(emotions, 'neutral'),
            },
            confidence: dominantEmotion.score,
        };

        // Extract gaze analysis using both iris and attention data
        const gaze: GazeAnalysis = {
            isLookingAtScreen: isLookingAtScreen(face),
            confidence: face.score || 0,
            gazeVector: {
                x: (face.rotation?.gaze?.strength || 0)
                    * Math.cos(face.rotation?.gaze?.bearing || 0),
                y: (face.rotation?.gaze?.strength || 0)
                    * Math.sin(face.rotation?.gaze?.bearing || 0),
                z: face.rotation?.angle?.pitch || 0,
            },
            headPose: {
                pitch: face.rotation?.angle?.pitch || 0,
                yaw: face.rotation?.angle?.yaw || 0,
                roll: face.rotation?.angle?.roll || 0,
            },
        };

        return { facial, emotion, gaze };
    } catch (error) {
        console.error('Error analyzing image with Human:', error);
        throw error;
    }
}

function extractEyePosition(
    mesh: Human.Point[],
    side: 'left' | 'right'
): { x: number; y: number } {
    const eyePoints = side === 'left' ? [159, 145] : [386, 374];
    return {
        x: mesh[eyePoints[0]]?.[0] || 0,
        y: mesh[eyePoints[0]]?.[1] || 0,
    };
}

function extractNosePosition(mesh: Human.Point[]): { x: number; y: number } {
    return {
        x: mesh[1]?.[0] || 0,
        y: mesh[1]?.[1] || 0,
    };
}

function extractMouthPosition(
    mesh: Human.Point[],
    side: 'left' | 'right'
): { x: number; y: number } {
    const point = side === 'left' ? 61 : 291;
    return {
        x: mesh[point]?.[0] || 0,
        y: mesh[point]?.[1] || 0,
    };
}

function getEmotionScore(
    emotions: { score: number; emotion: Human.Emotion }[],
    type: Human.Emotion
): number {
    const emotion = emotions.find((e) => e.emotion === type);
    return emotion?.score || 0;
}

function isEyesOpen(mesh: Human.Point[]): boolean {
    const leftEyeTop = mesh[159];
    const leftEyeBottom = mesh[145];
    const rightEyeTop = mesh[386];
    const rightEyeBottom = mesh[374];

    if (!leftEyeTop?.[1] || !leftEyeBottom?.[1] || !rightEyeTop?.[1] || !rightEyeBottom?.[1]) {
        return false;
    }

    const leftEyeOpenness = Math.abs(leftEyeTop[1] - leftEyeBottom[1]);
    const rightEyeOpenness = Math.abs(rightEyeTop[1] - rightEyeBottom[1]);

    const threshold = 0.02;
    return (leftEyeOpenness > threshold) && (rightEyeOpenness > threshold);
}

/**
 * Determines if the user is looking at the screen based on eye positions
 * relative to the face center and head pose
 */
function isLookingAtScreen(face: Human.FaceResult): boolean {
    if (!face.mesh || !face.box) return false;

    // Get face center - box coordinates are [x0, y0, x1, y1]
    const faceCenter = {
        x: (face.box[0] + face.box[2]) / 2,
        y: (face.box[1] + face.box[3]) / 2,
    };

    // Get average eye position
    const leftEye = extractEyePosition(face.mesh, 'left');
    const rightEye = extractEyePosition(face.mesh, 'right');
    const avgEyeY = (leftEye.y + rightEye.y) / 2;

    // Check if eyes are roughly centered vertically in face
    const faceHeight = face.box[3] - face.box[1];
    const verticalDeviation = Math.abs(avgEyeY - faceCenter.y) / faceHeight;

    // Check if head rotation is within reasonable bounds for screen viewing
    const yawAngle = Math.abs(face.rotation?.angle?.yaw || 0);
    const pitchAngle = Math.abs(face.rotation?.angle?.pitch || 0);

    return verticalDeviation < 0.3 && yawAngle < 0.5 && pitchAngle < 0.3;
}
