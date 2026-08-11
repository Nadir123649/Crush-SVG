export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dnsServers = process.env.DNS_SERVERS
    if (dnsServers) {
      const { setServers } = await import('node:dns')
      setServers(dnsServers.split(',').map((s) => s.trim()))
      console.log(`[crushsvg] DNS servers overridden: ${dnsServers}`)
    }
  }
}
