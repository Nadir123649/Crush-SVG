const comparisons = [
  ["Processing", "Canvas / browser processing where supported; some conversions use the CrushSVG API", "Typically processed on provider servers"],
  ["Privacy", "Browser processing keeps the source on your device; API conversions send it to CrushSVG for processing", "File handling and retention depend on the provider"],
  ["Output size", "Up to 8,192 ? 8,192 px (product output cap)", "Limits vary by provider"],
  ["Transparency", "PNG output supports alpha transparency when enabled", "Output/background support varies"],
  ["Code exports", "React JSX/TSX, Vue 3, Svelte, and React Native", "Often focused on raster exports"],
  ["Favicon exports", "Multi-size favicon package and web assets", "Formats and sizes vary"],
  ["Conversion quota", "Verified accounts have unlimited conversions; guest and unverified limits apply", "Limits vary by provider"],
] as const;

export function TechnicalComparisonTable() {
  return (
    <section aria-labelledby="technical-comparison-title" className="w-full max-w-[1000px] px-4 md:px-8 my-10 md:my-14">
      <h2 id="technical-comparison-title" className="mb-4 font-heading text-2xl font-semibold text-text-dark md:text-3xl">How CrushSVG processing compares</h2>
      <p className="mb-5 font-body text-sm text-text-muted">Processing path depends on the tool and file. Limits and privacy practices differ across third-party services.</p>
      <div className="overflow-x-auto rounded-xl border border-[#F2EDE8] bg-white">
        <table className="w-full min-w-[680px] border-collapse text-left font-body text-sm">
          <thead className="bg-[#FCF1ED] text-text-dark"><tr><th scope="col" className="p-4">Feature</th><th scope="col" className="p-4">CrushSVG</th><th scope="col" className="p-4">Traditional online converters</th></tr></thead>
          <tbody>{comparisons.map(([feature, crush, other]) => <tr key={feature} className="border-t border-[#F2EDE8] align-top"><th scope="row" className="p-4 font-semibold text-text-dark">{feature}</th><td className="p-4 text-text-muted">{crush}</td><td className="p-4 text-text-muted">{other}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
