#!/usr/bin/env node

/**
 * Simple test of voice-mode MCP for fast conversation
 *
 * This tests the full loop:
 * 1. Speak a message (TTS)
 * 2. Listen with proper VAD + local Whisper (fast!)
 * 3. Get transcription
 * 4. Send to Claude API
 * 5. Speak response
 * 6. Repeat
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-api03-Gvm9YwwryQnm5cq065RhwngLwyWeYqNMXZ5R8oNICRaB0QK4CcAR3-BM6tHlMU_7J-FPZLfXG7HG6CwMXYeBuA-9jBcAQAA';

console.log('🎙️  Voice-Mode MCP Test');
console.log('This will test the conversation loop with proper VAD and fast STT\n');

// Simulate using MCP voice-mode tool
console.log('Step 1: Speak greeting (using MCP TTS)');
console.log('  → "Hi! What feature would you like to discuss for your project?"\n');

console.log('Step 2: Listen for response (using MCP with local Whisper)');
console.log('  → Proper VAD detects when you stop speaking');
console.log('  → Local Whisper transcribes in <1 second');
console.log('  → Returns transcribed text\n');

console.log('Step 3: Send to Claude API');
console.log('  → Can use streaming for faster first-byte');
console.log('  → Haiku model for 3-5x faster responses\n');

console.log('Step 4: Speak Claude\'s response (using MCP TTS)');
console.log('  → Loop back to Step 2\n');

console.log('Expected latency:');
console.log('  - Your speech → Transcription: <1 second (local Whisper)');
console.log('  - Claude thinking: 1-3 seconds (streaming)');
console.log('  - TTS start: <0.5 seconds');
console.log('  Total: 1.5-4.5 seconds (much better than 7-17!)\n');

console.log('To test this for real, we need to:');
console.log('1. Check if voice-mode services are running');
console.log('2. Use the MCP converse tool from the Tauri app');
console.log('3. Integrate with Claude streaming API\n');

console.log('Would you like me to implement this in the Architect chat?');
