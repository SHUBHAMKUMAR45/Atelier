'use client'
import { useEffect, useState } from 'react'

interface QueueHealth {
  imageGeneration?: { waiting: number; active: number; completed: number; failed: number }
  dataLifecycle?:   { waiting: number; active: number; completed: number; failed: number }
}

interface HealthData {
  status:    string
  version:   string
  uptime:    number
  redis:     string
  queues:    QueueHealth | { status: string }
  timestamp: string
}

export default function AdminPage() {
  const [health, setHealth]     = useState<HealthData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchHealth = async () => {
    try {
      const resp = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'}/health`,
      )
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      setHealth(await resp.json() as HealthData)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch health')
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    void fetchHealth()
    const interval = setInterval(() => void fetchHealth(), 15_000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const isQueueHealth = (q: unknown): q is QueueHealth =>
    typeof q === 'object' && q !== null && 'imageGeneration' in q

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">System Admin</h1>
            <p className="text-gray-400 mt-1">Production health &amp; observability</p>
          </div>
          <button
            onClick={() => void fetchHealth()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div className="text-gray-400 text-center py-16">Loading system status…</div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-300 font-medium">⚠ API Unreachable</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        {health && (
          <div className="space-y-6">
            {/* System status bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Status', value: health.status === 'ok' ? '✅ Healthy' : '❌ Degraded', color: health.status === 'ok' ? 'text-green-400' : 'text-red-400' },
                { label: 'Version', value: `v${health.version}`, color: 'text-blue-400' },
                { label: 'Uptime', value: formatUptime(health.uptime), color: 'text-purple-400' },
                { label: 'Redis', value: health.redis === 'connected' ? '✅ Connected' : '⚠ Unavailable', color: health.redis === 'connected' ? 'text-green-400' : 'text-yellow-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-lg font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Queue health */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Queue Health</h2>
              {isQueueHealth(health.queues) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(health.queues).map(([name, counts]) => (
                    <div key={name} className="bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-400 text-sm font-medium mb-3 capitalize">
                        {name.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {Object.entries(counts as Record<string, number>).map(([k, v]) => (
                          <div key={k}>
                            <p className={`text-xl font-bold ${
                              k === 'failed' && v > 0 ? 'text-red-400' :
                              k === 'active' && v > 0 ? 'text-yellow-400' :
                              'text-white'
                            }`}>{v}</p>
                            <p className="text-gray-500 text-xs capitalize">{k}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-400 text-sm">
                  ⚠ Queue workers disabled — Redis unavailable
                </p>
              )}
            </div>

            {/* Metrics link */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-200">Prometheus Metrics</h2>
              <p className="text-gray-400 text-sm mb-4">
                Raw Prometheus metrics available at <code className="text-violet-400">/metrics</code> (admin token required in production).
              </p>
              <div className="flex gap-3">
                <a
                  href={`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'}/metrics`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                >
                  View /metrics →
                </a>
                <a
                  href="http://localhost:9090"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                >
                  Prometheus →
                </a>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                >
                  Grafana →
                </a>
              </div>
            </div>

            <p className="text-gray-600 text-xs text-right">
              Last refreshed: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 15s
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
