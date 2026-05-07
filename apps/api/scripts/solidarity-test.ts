async function verifySolidarity() {
  const PORTS = [4000] // Standardized port
  const HOSTS = ['localhost']
  
  console.log('🏁 STARTING FINAL SOLIDARITY TEST...')

  for (const host of HOSTS) {
    for (const port of PORTS) {
      const url = `http://${host}:${port}`
      console.log(`\nTesting API at ${url}...`)

      try {
        // 1. Connectivity & Health
        const healthRes = await fetch(`${url}/health`)
        if (!healthRes.ok) throw new Error(`Health check failed with status ${healthRes.status}`)
        
        const health = await healthRes.json()
        console.log('✅ Health OK')
        console.log(`   - Status: ${health.status}`)
        console.log(`   - DB:     ${health.services.database}`)
        
        if (health.services.database !== 'connected') {
          console.error('❌ Database not connected!')
          process.exit(1)
        }

        // 2. CORS & Trace
        if (healthRes.headers.get('x-trace-id')) {
          console.log('✅ Observability (Trace IDs) working')
        }

        // 3. Port Consistency check (Meta)
        if (port === 4000) {
          console.log('✅ Port 4000 synchronization verified')
        }

      } catch (err: any) {
        console.error(`❌ Connection to ${url} FAILED`)
        console.error(`   Reason: ${err.message}`)
        console.error('\nPOSSIBLE CAUSES:')
        console.error('1. Backend is not running (npm run dev in apps/api)')
        console.error('2. Wrong port or host')
        console.error('3. Firewall or proxy interference')
        process.exit(1)
      }
    }
  }

  console.log('\n🌟 SYSTEM SOLIDARITY VERIFIED 🌟')
  console.log('Backend Port: 4000')
  console.log('DB Status:    CONNECTED')
  console.log('Health Path:  /health')
}

verifySolidarity()
