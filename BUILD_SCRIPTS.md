# ARIS Build Scripts

## Overview
I've created build scripts to make compiling ARIS easier for deployment.

## Created Files

### 1. run-build.bat (Windows)
**Purpose**: One-click build script for Windows
**Usage**: `npm run build-full` or run `run-build.bat`

**Features**:
- ✅ Checks for Node.js
- ✅ Installs frontend dependencies (`npm install`)
- ✅ Builds frontend (`npm run build`) 
- ✅ Installs server dependencies (`server/npm install`)
- ✅ Shows build summary
- ✅ Provides next steps

### 2. run-build.sh (Linux/Mac)
**Purpose**: Cross-platform build script for Unix systems
**Usage**: `chmod +x run-build.sh && ./run-build.sh`

**Features**:
- ✅ All same features as Windows version
- ✅ Cross-platform compatibility
- ✅ Clear error handling

### 3. Updated package.json
**Added**: `"build-full": "run-build.bat"` script

## How to Use

### Windows
```bash
npm run build-full
```

### Linux/Mac  
```bash
chmod +x run-build.sh
./run-build.sh
```

## Build Output
- **Frontend**: Built to `dist/` directory
- **Server**: Ready with dependencies in `server/`
- **Size**: Optimized production build with code splitting

## Integration with Existing
These build scripts work alongside existing development tools:
- `npm run dev` - Frontend development server
- `cd server && npm run dev` - Backend development server  
- `run_dev.bat` - Both frontend and backend
- `deploy.ps1` / `deploy.sh` - Cloud Run deployment

## Next Steps
1. Test the build scripts work
2. Integrate with CI/CD pipeline if needed
3. Update documentation

## Voice Fixes Applied
The build scripts were created after fixing voice functionality issues. Voice is now **enabled by default** in ARIS!