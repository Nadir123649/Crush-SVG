export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env')
    validateEnv()

    const dnsServers = process.env.DNS_SERVERS
    if (dnsServers) {
      const { setServers } = await import('node:dns')
      setServers(dnsServers.split(',').map((s) => s.trim()))
      console.log(`[crushsvg] DNS servers overridden: ${dnsServers}`)
    }

    const { connectToDatabase } = await import('@/lib/db')
    void (async () => {
      for (let attempt = 1; ; attempt++) {
        try {
          await connectToDatabase()
          return
        } catch (err) {
          console.error(
            `[crushsvg] MongoDB connection attempt ${attempt} failed, retrying in 5s:`,
            err
          )
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      }
    })()
  }
}
