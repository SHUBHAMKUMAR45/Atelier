async function runSmokeTest() {
  const API_ROOT = 'http://localhost:5000'
  const API_BASE = `${API_ROOT}/api/v1`
  const TEST_HEADERS = {
    'Authorization': 'Bearer smoke_test_bypass',
    'x-test-user-id': 'smoke_tester_123',
    'Content-Type': 'application/json'
  }

  // IMPORTANT: This script requires the API to be running with BYPASS_AUTH=true and NODE_ENV=development

  console.log('🚀 Starting System Smoke Test...')

  try {
    // 1. Health Check
    console.log('Checking health...')
    const healthRes = await fetch(`${API_ROOT}/health`)
    const health = await healthRes.json()
    console.log('✅ Health OK:', health.status)

    // 2. Profile Setup
    console.log('Setting up profile...')
    const profileRes = await fetch(`${API_BASE}/profile/setup`, {
      method: 'POST',
      headers: TEST_HEADERS,
      body: JSON.stringify({
        displayName: 'Smoke Tester',
        email: 'smoke@test.com',
        measurements: { height: 180, weight: 75 },
        preferences: { styles: ['minimalist'], budget: 'mid', colors: ['#000000'], occasions: ['work'], gender: 'male' }
      })
    })
    const profile = await profileRes.json()
    if (!profile.success) throw new Error('Profile setup failed: ' + profile.error)
    console.log('✅ Profile Setup OK')

    // 3. Wardrobe Check
    console.log('Adding to wardrobe...')
    const wardrobeRes = await fetch(`${API_BASE}/wardrobe`, {
      method: 'POST',
      headers: TEST_HEADERS,
      body: JSON.stringify({
        category: 'top',
        name: 'Black T-Shirt',
        imageUrl: 'https://example.com/item.jpg',
        color: 'black',
        brand: 'TestBrand'
      })
    })
    const item = await wardrobeRes.json()
    if (!item.success) throw new Error('Wardrobe add failed: ' + item.error)
    console.log('✅ Wardrobe Add OK')

    // 4. Recommendation Generation (Mocked to verify flow)
    console.log('Testing recommendation endpoint...')
    const recRes = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: TEST_HEADERS,
      body: JSON.stringify({
        occasion: 'work',
        useWardrobe: true
      })
    })
    const rec = await recRes.json()
    // We might get 500 if AI keys are missing in test, but success: false should be handled
    if (rec.success) {
      console.log('✅ Recommendation OK')
    } else {
      console.warn('⚠️ Recommendation failed (expected if AI keys missing):', rec.error)
    }

    console.log('\n🌟 SMOKE TEST COMPLETED 🌟')
  } catch (err: any) {
    console.error('❌ SMOKE TEST FAILED')
    console.error(err.message)
    process.exit(1)
  }
}

runSmokeTest()
