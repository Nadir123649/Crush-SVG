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

    // Warm fontconfig at server startup so the first conversion request does
    // not pay the ~650ms scan cost. Importing the module writes the config and
    // sets FONTCONFIG_PATH; the tiny render below forces the actual font scan.
    await import('@/lib/svg/font-config')
    try {
      const sharp = (await import('sharp')).default
      // Minimal SVG with <text> — triggers fontconfig scan without spending time on pixels
      const warmSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><text>.</text></svg>',
        'utf-8'
      )
      await sharp(warmSvg, { density: 72, limitInputPixels: 1000 }).resize(1, 1).raw().toBuffer()
      console.log('[crushsvg] fontconfig scan complete')
    } catch (err) {
      console.warn('[crushsvg] fontconfig warm-up render failed (non-fatal):', err)
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
