<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sm xhtml">
  <xsl:output method="html" encoding="UTF-8" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>XML Sitemap</title>
        <style>
          :root { color-scheme: dark; background: #111; color: #f5f5f5; font: 14px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; }
          body { margin: 1rem; }
          .brand { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.25rem; font: 700 1.2rem/1.4 system-ui, sans-serif; }
          .brand a { display: inline-flex; align-items: center; gap: 0.65rem; color: #f5f5f5; text-decoration: none; }
          .brand img { width: 2rem; height: 2rem; border-radius: 0.45rem; }
          h1 { margin: 0; font: inherit; }
          .hint { margin: 0 0 1.25rem 2.65rem; color: #999; font: 0.85rem system-ui, sans-serif; }
          details { margin-left: 1.25rem; }
          summary { cursor: pointer; }
          .tag { color: #48c8f5; }
          .children { margin-left: 1.25rem; }
          .field { margin: 0.1rem 0; overflow-wrap: anywhere; }
          .value { color: inherit; }
          .alternate { color: #999; }
        </style>
      </head>
      <body>
        <header class="brand">
          <a href="https://www.crushsvg.net/">
            <img src="/icon-192.png" alt="" />
            <h1>CrushSVG</h1>
          </a>
        </header>
        <p class="hint">
          XML Sitemap · <xsl:value-of select="count(/sm:urlset/sm:url)" /> URLs
        </p>
        <details open="open">
          <summary><span class="tag">&lt;urlset&gt;</span></summary>
          <div class="children">
            <xsl:for-each select="/sm:urlset/sm:url">
              <details open="open">
                <summary>
                  <span class="tag">&lt;url&gt;</span>
                </summary>
                <div class="children">
                  <xsl:if test="sm:loc">
                    <div class="field">
                      <span class="tag">&lt;loc&gt;</span>
                      <span class="value"><xsl:value-of select="sm:loc" /></span>
                      <span class="tag">&lt;/loc&gt;</span>
                    </div>
                  </xsl:if>
                  <xsl:if test="sm:lastmod">
                    <div class="field">
                      <span class="tag">&lt;lastmod&gt;</span>
                      <span class="value"><xsl:value-of select="sm:lastmod" /></span>
                      <span class="tag">&lt;/lastmod&gt;</span>
                    </div>
                  </xsl:if>
                  <xsl:if test="sm:changefreq">
                    <div class="field">
                      <span class="tag">&lt;changefreq&gt;</span>
                      <span class="value"><xsl:value-of select="sm:changefreq" /></span>
                      <span class="tag">&lt;/changefreq&gt;</span>
                    </div>
                  </xsl:if>
                  <xsl:if test="sm:priority">
                    <div class="field">
                      <span class="tag">&lt;priority&gt;</span>
                      <span class="value"><xsl:value-of select="sm:priority" /></span>
                      <span class="tag">&lt;/priority&gt;</span>
                    </div>
                  </xsl:if>
                  <xsl:if test="xhtml:link">
                    <details>
                      <summary class="alternate">
                        <span class="tag">&lt;xhtml:link&gt;</span>
                        <xsl:text> alternate languages</xsl:text>
                      </summary>
                      <div class="children">
                        <xsl:for-each select="xhtml:link">
                          <div class="field alternate">
                            <span class="tag">&lt;xhtml:link rel="alternate" hreflang="</span>
                            <xsl:value-of select="@hreflang" />
                            <span class="tag">" href="</span>
                            <xsl:value-of select="@href" />
                            <span class="tag">" /&gt;</span>
                          </div>
                        </xsl:for-each>
                      </div>
                    </details>
                  </xsl:if>
                  <span class="tag">&lt;/url&gt;</span>
                </div>
              </details>
            </xsl:for-each>
          </div>
        </details>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
