/**
 * Quick test script to verify Agora API integration
 * Run: node test-agora-api.js
 */

const axios = require('axios');

const gatewayUrl = 'http://localhost:5000';

async function testAgoraConfig() {
  try {
    console.log('\n=== Testing Agora Configuration ===');
    const response = await axios.get(`${gatewayUrl}/debug/agora-config`);
    console.log('✅ Agora Config Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error testing config:', error.message);
  }
}

async function testTokenGeneration() {
  try {
    console.log('\n=== Testing Token Generation ===');
    const channelName = 'test-appointment-123';
    const response = await axios.get(`${gatewayUrl}/debug/test-token/${channelName}`);
    console.log('✅ Token Generation Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('\n📋 Token Details:');
      console.log('   appId:', response.data.data.appId);
      console.log('   doctorToken:', response.data.data.doctorToken ? `✓ (${response.data.data.doctorToken.substring(0, 30)}...)` : '✗ Missing');
      console.log('   patientToken:', response.data.data.patientToken ? `✓ (${response.data.data.patientToken.substring(0, 30)}...)` : '✗ Missing');
    }
  } catch (error) {
    console.error('❌ Error generating token:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Agora API Tests...\n');
  
  await testAgoraConfig();
  await testTokenGeneration();
  
  console.log('\n✅ Tests complete!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
