# Engagement Capture Module

This module provides real-time engagement analysis for video conference participants using advanced computer vision and machine learning techniques. It leverages the [@vladmandic/human](https://github.com/vladmandic/human) library for facial analysis, emotion detection, and gaze tracking.

## Features

- **Facial Analysis**: Tracks facial landmarks, head pose, and eye state
- **Emotion Detection**: Analyzes participant emotions (happy, sad, angry, surprised, neutral)
- **Gaze Tracking**: Determines if participants are looking at the screen
- **Engagement Scoring**: Calculates real-time engagement scores based on multiple factors

## Architecture

The module consists of three main components:

1. **Human Analysis** (`human-analysis.ts`)
   - Handles image processing using the Human library
   - Extracts facial features, emotions, and gaze information
   - Provides standardized analysis results

2. **Engagement Scoring** (`engagement-scoring.ts`)
   - Calculates engagement scores based on multiple factors:
     - Eye contact quality
     - Emotional state
     - Attention level
   - Provides normalized scores between 0 and 1

3. **Type Definitions** (`types.ts`)
   - Defines interfaces for all data structures
   - Ensures type safety throughout the module

## Usage

```typescript
import { analyzeImage } from './human-analysis';
import { calculateEngagementScore } from './engagement-scoring';

// Analyze a frame
const analysis = await analyzeImage(base64ImageData);

// Calculate engagement score
const engagementScore = calculateEngagementScore(
    analysis.facial,
    analysis.emotion,
    analysis.gaze,
    timestamp
);
```

## Data Structures

### Frame Data
```typescript
interface FrameData {
    imageData: string;      // Base64 encoded image
    meetingId: string;      // Unique meeting identifier
    participantId: string;  // Unique participant identifier
    timestamp: number;      // Unix timestamp
}
```

### Analysis Results
```typescript
interface HumanAnalysisResult {
    facial: FacialAnalysis;   // Facial landmarks and pose
    emotion: EmotionAnalysis; // Detected emotions
    gaze: GazeAnalysis;       // Gaze direction and attention
}
```

### Engagement Score
```typescript
interface EngagementScore {
    score: number;           // Overall engagement (0-1)
    factors: {
        eyeContact: number;  // Quality of eye contact
        emotion: number;     // Emotional engagement
        attention: number;   // Attention level
    };
    timestamp: number;
}
```

## Configuration

The Human library is configured for optimal performance in a Node.js environment with the following settings:

- Uses TensorFlow backend
- Optimized for single face detection
- Standardized input size (512px)
- Disabled unnecessary models (body, hand, object detection)
- Warm-up enabled for faster initial detection

## Performance Considerations

- Image processing is performed using TensorFlow.js
- Models are loaded from local files for better performance
- Input images are automatically resized and normalized
- Memory management is handled automatically
- Processing time varies based on input image size and complexity

## Dependencies

- @vladmandic/human: Advanced human-centric computer vision library
- TensorFlow.js: Machine learning framework

## Error Handling

The module includes robust error handling for common scenarios:

- No face detected in frame
- Invalid image data
- Model initialization failures
- Memory management issues

Errors are logged with appropriate context for debugging.

## Best Practices

1. Process images at regular intervals (e.g., every 1-2 seconds)
2. Ensure good lighting conditions for optimal detection
3. Center participants in the frame when possible
4. Monitor memory usage in production environments
5. Handle errors gracefully to maintain service stability

## Deployment

Before deploying the functions, follow these steps:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run linter with auto-fix:
   ```bash
   npm run lint -- --fix
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to Firebase:
   ```bash
   firebase deploy --only functions
   ```

### Important Notes:
- Always run the linter before deploying to ensure code consistency
- Check for TypeScript errors in the build output
- Verify the correct Firebase project is selected
- Monitor deployment logs for any initialization errors 