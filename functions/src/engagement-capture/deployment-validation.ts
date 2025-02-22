import * as fs from 'fs';
import * as path from 'path';

/**
 * Validates that all required models are present and accessible
 * This should be run during deployment to catch issues early
 */
export function validateModelDeployment(): void {
    console.log('\n=== Deployment Validation ===');

    const modelPath = path.join(__dirname, '..', 'models');
    console.log('Validating models at:', modelPath);

    // Check model directory
    if (!fs.existsSync(modelPath)) {
        throw new Error(`Model directory not found at: ${modelPath}`);
    }

    // List all files in models directory
    const modelFiles = fs.readdirSync(modelPath);
    console.log('Found model files:', modelFiles);

    // Required model files
    const requiredModels = ['blazeface.json', 'emotion.json', 'iris.json'];

    // Validate each required model
    const missingModels: string[] = [];
    const invalidModels: string[] = [];

    requiredModels.forEach((model) => {
        const modelFilePath = path.join(modelPath, model);
        console.log(`\nValidating ${model}:`);

        if (!fs.existsSync(modelFilePath)) {
            console.error(`- Missing model: ${model}`);
            missingModels.push(model);
            return;
        }

        try {
            // Check file is readable
            fs.accessSync(modelFilePath, fs.constants.R_OK);
            console.log('- File is readable');

            // Check file size
            const stats = fs.statSync(modelFilePath);
            console.log(`- File size: ${stats.size} bytes`);

            // Validate JSON structure
            const content = fs.readFileSync(modelFilePath, 'utf8');
            JSON.parse(content);
            console.log('- Valid JSON structure');
        } catch (error) {
            console.error(`- Invalid model file ${model}:`, error);
            invalidModels.push(model);
        }
    });

    // Report validation results
    if (missingModels.length > 0 || invalidModels.length > 0) {
        throw new Error('Model validation failed:\n'
            + (missingModels.length > 0 ? `Missing models: ${missingModels.join(', ')}\n` : '')
            + (invalidModels.length > 0 ? `Invalid models: ${invalidModels.join(', ')}` : ''));
    }

    console.log('\n✅ All models validated successfully');
}
