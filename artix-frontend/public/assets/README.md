# 🎬 Video Assets Setup Guide

## Overview

This directory contains video and image assets for the ARTIX 2026 landing page video background.

## Current Directory Structure

```
public/
├── assets/
│   ├── videos/
│   │   └── iot-animation.mp4    (TO BE ADDED)
│   └── images/
│       └── iot-poster.jpg       (TO BE ADDED)
```

## Required Files

### 1. Video: `iot-animation.mp4`

- **Location**: `public/assets/videos/iot-animation.mp4`
- **Requirements**:
  - Format: MP4 (H.264 codec)
  - Duration: 15-30 seconds
  - Dimensions: 1920x1080 (16:9 aspect ratio)
  - File size: < 5MB (for optimal loading)
  - Frame rate: 30fps or 60fps
  - Recommended bitrate: 2-4 Mbps
- **Purpose**: Background animation for hero section
- **Content Ideas**:
  - IoT network visualization
  - Robotics in action
  - Circuit board animations
  - Data flow visualization
  - Particle effects

### 2. Poster Image: `iot-poster.jpg`

- **Location**: `public/assets/images/iot-poster.jpg`
- **Requirements**:
  - Format: JPG/JPEG
  - Dimensions: 1920x1080 (16:9 aspect ratio)
  - File size: < 500KB
  - Quality: High quality, slightly darker for text overlay
- **Purpose**: Fallback image while video loads (mobile, unsupported browsers)
- **Content**: Same or similar to video first frame

## Implementation Status

### ✅ What's Done

- [x] Directory structure created
- [x] App.tsx routing updated to show LandingPage for "/"
- [x] pages/LandingPage.tsx created and configured
- [x] HeroSection.tsx component ready (with fallback support)
- [x] VideoBackground component ready
- [x] Asset paths configured in components

### ⏳ What Needs To Be Done

1. Create or download video file (iot-animation.mp4)
2. Place in `public/assets/videos/iot-animation.mp4`
3. Create or download poster image (iot-poster.jpg)
4. Place in `public/assets/images/iot-poster.jpg`
5. Test in browser to confirm video plays

## How to Add Videos

### Option 1: Use Online Tool (Easiest)

1. Go to [Remove.bg](https://remove.bg) or similar tool with video creation
2. Upload a robotics/IoT image
3. Export as short MP4
4. Place in `public/assets/videos/iot-animation.mp4`

### Option 2: Create with Software

**Recommended**: Use one of these FREE tools:

- **DaVinci Resolve** (Free, professional)
- **CapCut** (Easy, online)
- **Blender** (Free, can create 3D animations)
- **Adobe Spark Video** (Free trial)

**Create a video with**:

- IoT/Robotics theme
- Blue/Purple gradient colors (matches site theme)
- Smooth animations (not jarring transitions)
- Text overlays optional

### Option 3: Use Stock Video Sites

**Free stock videos**:

- [Pexels](https://www.pexels.com/videos/)
- [Pixabay](https://pixabay.com/videos/)
- [Coverr](https://coverr.co/)

**Search for**: "robotics", "IoT", "technology", "network", "data", "artificial intelligence"

## Testing Video Loading

### 1. Using Browser DevTools

```javascript
// In browser console (F12)
const video = document.querySelector('video');
console.log('Video source:', video.src);
console.log('Video canPlay', video.canPlayType('video/mp4'));
console.log('Video readyState:', video.readyState); // 0=not started, 4=fully loaded
```

### 2. Direct URL Test

Open in browser: `http://localhost:5173/assets/videos/iot-animation.mp4`
You should see video player or download prompt

### 3. Network Tab Test

1. Open DevTools → Network tab
2. Reload page
3. Look for `iot-animation.mp4` request
4. Check:
   - Status: 200 (not 404)
   - Size: matches file size
   - Type: video/mp4

## Fallback Behavior

The VideoBackground component has multiple fallback levels:

1. **Video Plays**: Best experience, full animation
2. **Video Fails, Poster Loads**: Still shows nice static image
3. **Poster Fails, Gradient Shows**: Degraded but still working
4. **Mobile Optimization**: Reduced video quality or gradient only

## File Size Optimization

For best performance, video should be < 5MB:

### Using FFmpeg (Free Command Line Tool)

```bash
# Install FFmpeg first
# Then run:
ffmpeg -i input.mp4 -vf scale=1920:1080 -b:v 2500k -b:a 128k output.mp4

# For smaller file:
ffmpeg -i input.mp4 -vf scale=1280:720 -b:v 1500k -b:a 96k output.mp4
```

### Using Online Compressor

- [CloudConvert](https://cloudconvert.com/mp4-mp4)
- [Online-Convert](https://online-convert.com/)
- [Compressor.io](https://compressor.io/)

## Current Component Configuration

### HeroSection.tsx

```tsx
<HeroSection
  title="ARTIX 2026"
  subtitle="Advanced Robotics and IoT Innovation eXchange"
  callToAction="Start Your Journey"
  onCTAClick={navigateToRegister}
  videoSrc="/assets/videos/iot-animation.mp4"
  posterImage="/assets/images/iot-poster.jpg"
/>
```

### VideoBackground.tsx

```tsx
<VideoBackground
  videoSrc="/assets/videos/iot-animation.mp4"
  posterImage="/assets/images/iot-poster.jpg"
  autoPlay={true}
  muted={true}
  loop={true}
/>
```

## Troubleshooting

### Video Not Showing

**Problem**: `iot-animation.mp4` not found (404)
**Solution**: Ensure file is in `public/assets/videos/` folder

### Video Not Playing

**Problem**: Browser can't play MP4
**Solution**:

- Check video codec (H.264 required)
- Check file is not corrupted
- Try in different browser

### Poster Not Showing

**Problem**: Image loads but is wrong size
**Solution**: Ensure aspect ratio is 16:9 (1920x1080)

### Performance Issues

**Problem**: Page loads slowly, video stutters
**Solution**:

- Reduce video bitrate (use 2Mbps instead of 4Mbps)
- Reduce resolution (1280x720 instead of 1920x1080)
- Compress video file

## Integration Complete ✅

**The landing page is ready to showcase your video!**

Just add the video and poster image files, and the animation will display automatically:

1. ✅ Routing configured (/ → LandingPage, /register → RegistrationPage)
2. ✅ Components ready (HeroSection + VideoBackground)
3. ✅ Fallback support (poster image + gradient)
4. ✅ Mobile optimized
5. ⏳ **Awaiting video file upload**

Once you add the video file, go to `http://localhost:5173` to see it in action!

---

**Questions?** Check the component files:

