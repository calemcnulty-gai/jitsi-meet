# Local Development Setup Guide

## Prerequisites
- [x] Git installed
- [x] Node.js v22 installed (required by package.json)
- [x] Make installed

## Initial Setup Steps

### 1. Repository Setup
- [x] Fork the Jitsi Meet repository
- [x] Clone your fork:
  ```bash
  git clone https://github.com/YOUR_USERNAME/jitsi-meet.git
  cd jitsi-meet
  ```

### 2. Development Environment Setup
- [x] Install dependencies:
   ```bash
   npm install
   ```
- [x] Set up TypeScript configuration:
   ```bash
   cp tsconfig.web.json tsconfig.json
   ```
- [x] Set up initial configuration:
   ```bash
   cp config.js.example config.js
   ```

### 3. Start Development Server
- [x] Run the development server:
  ```bash
  make dev
  ```
- [x] Wait for compilation to complete
- [x] Access app at http://localhost:8080

### 4. Verify Setup
- [x] Open http://localhost:8080 in browser
- [x] Create a test room (e.g., http://localhost:8080/test123)
- [x] Verify video/audio permissions work
- [x] Test basic meeting functionality

## Development Commands
- `make` - Compile the full application
- `make dev` - Start development server
- `npm run lint` - Run code linting
- `npm test` - Run tests

## Troubleshooting

### Common Issues
1. Port conflicts:
   - Check if port 8080 is already in use
   - Change port in dev server config if needed

2. Node.js version mismatch:
   - Ensure you're using Node.js v22 (`node -v`)
   - Use nvm or similar to switch versions if needed

3. npm install fails:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and try again
   - Check for required system dependencies

4. Make command not found:
   - Install make through your system package manager
   - For macOS: `brew install make`

### Getting Help
- Check [Jitsi Meet Handbook](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-start)
- Review issues in the main repository
- Join Jitsi community channels

## Notes
- This setup focuses on the web version development
- For full deployment setup, refer to the [deployment guide](https://jitsi.github.io/handbook/docs/category/deployment)
- For mobile/native development, additional setup steps are required 