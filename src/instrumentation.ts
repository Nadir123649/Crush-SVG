export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/shared/env')
    validateEnv()

    const dnsServers = process.env.DNS_SERVERS
    if (dnsServers) {
      const { setServers } = await import('node:dns')
      setServers(dnsServers.split(',').map((s) => s.trim()))
      console.log(`[crushsvg] DNS servers overridden: ${dnsServers}`)
    }

    const { connectToDatabase } = await import('@/lib/database/db')
    const MAX_ATTEMPTS = 3
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await connectToDatabase()
        return
      } catch (err) {
        console.error(
          `[crushsvg] MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
          err
        )
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
        }
      }
    }
    console.warn('[crushsvg] MongoDB unreachable after retries — continuing startup; requests will fail until reachable.')
  }
}
