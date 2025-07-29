// Simple TTS API test script
const fs = require('fs');

async function testTTS() {
  console.log('🧪 Testing Gemini TTS API...');
  
  try {
    // Test 1: GET request for available voices
    console.log('\n1️⃣ Testing GET /api/generate-tts (available voices)...');
    const getResponse = await fetch('http://localhost:3000/api/generate-tts');
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET request successful!');
      console.log(`   Found ${data.voices?.length || 0} voices`);
      console.log(`   Example voices: ${data.voices?.slice(0, 3).map(v => v.name).join(', ')}`);
    } else {
      console.log('❌ GET request failed:', getResponse.status);
    }

    // Test 2: POST request for TTS generation
    console.log('\n2️⃣ Testing POST /api/generate-tts (audio generation)...');
    
    const postData = {
      text: "Hallo! Dit is een test van Gemini Text-to-Speech. De kwaliteit zou uitstekend moeten zijn!",
      voiceName: "Kore",
      multiSpeaker: false,
      style: "Gelukkig"
    };

    const postResponse = await fetch('http://localhost:3000/api/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    if (postResponse.ok) {
      console.log('✅ POST request successful!');
      console.log(`   Content-Type: ${postResponse.headers.get('content-type')}`);
      console.log(`   Content-Length: ${postResponse.headers.get('content-length')} bytes`);
      
      // Save audio file for manual testing
      const audioBuffer = await postResponse.arrayBuffer();
      fs.writeFileSync('test-output.wav', Buffer.from(audioBuffer));
      console.log('💾 Audio saved as test-output.wav');
      console.log('🎵 You can now play this file to test the audio quality!');
    } else {
      console.log('❌ POST request failed:', postResponse.status);
      const errorText = await postResponse.text();
      console.log('   Error:', errorText);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Check if we're in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - need to polyfill fetch
  if (!global.fetch) {
    console.log('Installing fetch polyfill...');
    import('node-fetch').then(fetch => {
      global.fetch = fetch.default;
      testTTS();
    }).catch(() => {
      console.log('❌ node-fetch not available. Please run: npm install node-fetch');
      console.log('Or manually test the endpoints using curl or your browser.');
    });
  } else {
    testTTS();
  }
} else {
  // Browser environment
  testTTS();
} 