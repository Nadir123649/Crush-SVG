const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'sections', 'ConverterUI.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add mode prop
content = content.replace(
  'export function ConverterUI() {',
  'export function ConverterUI({ mode = "svg-to-png" }: { mode?: "svg-to-png" | "raster-to-svg" }) {'
);

// 2. Add state
content = content.replace(
  'const [progress, setProgress] = useState(0);',
  `const [progress, setProgress] = useState(0);
  const [rasterFile, setRasterFile] = useState<File | null>(null);
  const [rasterDataUrl, setRasterDataUrl] = useState<string | null>(null);
  const storageKey = mode === "raster-to-svg" ? "crush_vectorizer_state" : CONVERTER_STORAGE_KEY;`
);

// 3. Storage reads
content = content.replace(
  /const raw = sessionStorage\.getItem\(CONVERTER_STORAGE_KEY\);/g,
  `const raw = sessionStorage.getItem(storageKey);`
);

content = content.replace(
  /if \(typeof saved\.svgCode === "string" && saved\.svgCode\.trim\(\) !== ""\) \{\s*setSvgCode\(saved\.svgCode\);\s*\}/,
  `if (mode === "raster-to-svg") {
          const r = saved as { rasterDataUrl?: unknown };
          if (typeof r.rasterDataUrl === "string") setRasterDataUrl(r.rasterDataUrl);
        } else {
          if (typeof saved.svgCode === "string" && saved.svgCode.trim() !== "") {
            setSvgCode(saved.svgCode);
          }
        }`
);

// 4. Storage writes
content = content.replace(
  /sessionStorage\.setItem\(CONVERTER_STORAGE_KEY, JSON\.stringify\(\{ svgCode, result: persistableResult \}\)\);/g,
  `sessionStorage.setItem(storageKey, JSON.stringify(mode === "raster-to-svg" ? { rasterDataUrl, result: persistableResult } : { svgCode, result: persistableResult }));`
);
// Dependencies for storage effect
content = content.replace(
  /}, \[svgCode, result\]\);/g,
  `}, [svgCode, rasterDataUrl, result, mode]);`
);

// 5. Storage remove
content = content.replace(
  /sessionStorage\.removeItem\(CONVERTER_STORAGE_KEY\);/g,
  `sessionStorage.removeItem(storageKey);`
);
content = content.replace(
  /function handleClearSvg\(\) \{/,
  `function handleClearSvg() {
    if (mode === "raster-to-svg") {
      setRasterFile(null);
      setRasterDataUrl(null);
    }`
);


// 6. handleFile
content = content.replace(
  'if (!file) return;',
  `if (!file) return;
    if (mode === "raster-to-svg") {
      if (!file.type.includes("image/png") && !file.type.includes("image/jpeg") && !file.name.toLowerCase().endsWith(".png") && !file.name.toLowerCase().endsWith(".jpg") && !file.name.toLowerCase().endsWith(".jpeg")) {
        setError("Please choose a PNG or JPG image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image too large. Maximum size is 5MB.");
        return;
      }
      setRasterFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setRasterDataUrl(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
      return;
    }`
);

// 7. handleConvert
content = content.replace(
  'if (isPlaceholderCode || svgCode.trim() === "") {',
  `if (mode === "raster-to-svg") {
      if (!rasterFile && !rasterDataUrl) {
        showToast("error", "No image selected. Upload a PNG or JPG to convert.");
        return;
      }
      setError(null);
      setConverting(true);
      try {
        const formData = new FormData();
        if (rasterFile) {
            formData.append('file', rasterFile);
        } else {
            // we have dataUrl but no file (restored from session). For simplicity, we require the file to convert, or we could fetch the data url to a blob.
            // Converting data url to file:
            const res = await fetch(rasterDataUrl!);
            const blob = await res.blob();
            formData.append('file', blob, 'restored-image.png');
        }
        
        const token = getAccessToken();
        const res = await fetch('/api/v1/vectorize', {
          method: 'POST',
          headers: token ? { 'Authorization': \`Bearer \${token}\` } : {},
          body: formData
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new ApiError(res.status, errData.code || "unknown_error", errData.message || "Vectorization failed");
        }
        
        const data = await res.json();
        setResult({ data: data.payload.svg, format: "svg", mimeType: "image/svg+xml", size: data.payload.svg.length, width: 0, height: 0, conversionsUsed: data.payload.conversionsUsed, remaining: data.payload.remaining, warnings: [] });
        showToast("success", "Vectorization successful! Ready to download.");
        trackConversion("raster_vectorized", { output_format: "svg" });
        
        if (data.payload.remaining !== undefined) {
          const reached = data.payload.remaining === 0;
          setUsage({
            conversionsUsed: data.payload.conversionsUsed,
            remaining: data.payload.remaining,
            isUnlimited: false,
            limitReached: reached,
          });
          window.dispatchEvent(new CustomEvent("crushUsageUpdated", { detail: { conversionsUsed: data.payload.conversionsUsed, remaining: data.payload.remaining } }));
        }
      } catch (err) {
        if (err instanceof ApiError && err.code === "limit_reached" && status !== "authed") {
          setShowSignupPrompt(true);
          return;
        }
        showToast("error", err instanceof Error ? err.message : "Conversion failed. Please try again.");
      } finally {
        setConverting(false);
      }
      return;
    }

    if (isPlaceholderCode || svgCode.trim() === "") {`
);

// 8. Update Left Column Rendering
content = content.replace(
  /<h2 className="font-heading font-semibold text-\[16px\] text-\[#475569\]">\s*SVG Code\s*<\/h2>/g,
  `<h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  {mode === "raster-to-svg" ? "Raster Image" : "SVG Code"}
                </h2>`
);

// 9. Hide text area & bottom text when mode is raster-to-svg, show drag & drop instead
content = content.replace(
  /\{\/\* SVG Code Box \*\/\}/,
  `{mode === "svg-to-png" && (
                <>
                {/* SVG Code Box */}`
);

content = content.replace(
  /<input\s*ref=\{fileInputRef\}\s*id="svg-file-upload"\s*type="file"\s*aria-label="Upload SVG file"\s*accept="\.svg,image\/svg\+xml"\s*className="absolute w-0 h-0 opacity-0 overflow-hidden"\s*onChange=\{\(e\) => \{ void handleFile\(e\.target\.files\?\.\[0\]\); e\.target\.value = "" \}\}\s*\/>/g,
  `</>
              )}
              
              {mode === "raster-to-svg" && (
                  <>
                  {rasterDataUrl ? (
                      <div className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden flex items-center justify-center p-[20px]">
                          <img src={rasterDataUrl} className="max-w-full max-h-full object-contain" alt="Selected Raster Image" />
                      </div>
                  ) : (
                      <div className="w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden flex items-center justify-center">
                          <p className="font-body text-[#94A3B8]">No image selected</p>
                      </div>
                  )}
                  </>
              )}

              <input
                ref={fileInputRef}
                id="svg-file-upload"
                type="file"
                aria-label={mode === "raster-to-svg" ? "Upload PNG/JPG file" : "Upload SVG file"}
                accept={mode === "raster-to-svg" ? ".png,.jpg,.jpeg,image/png,image/jpeg" : ".svg,image/svg+xml"}
                className="absolute w-0 h-0 opacity-0 overflow-hidden"
                onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = "" }}
              />`
);

content = content.replace(
  /<span className="font-medium text-brand-primary">Select SVG<\/span>/,
  `<span className="font-medium text-brand-primary">{mode === "raster-to-svg" ? "Select Image" : "Select SVG"}</span>`
);

content = content.replace(
  /\{\/\* Bottom Source Text \*\/\}/,
  `{mode === "svg-to-png" && (
                  <>
                  {/* Bottom Source Text */}`
);

content = content.replace(
  /<\/span>\s*<\/p>\s*<\/div>\s*\{\/\* Right Column \(Live Preview\) \*\/\}/,
  `</span>
              </p>
                  </>
              )}

            </div>

            {/* Right Column (Live Preview) */}`
);


// 10. Hide dimensions controls when mode is raster-to-svg
content = content.replace(
  /\{\/\* Dropdowns Row \*\/\}/,
  `{/* Dropdowns Row */}
                {mode === "svg-to-png" && (`
);

content = content.replace(
  /<\/div>\s*\{\/\* Action Row \*\/\}/,
  `</div>
                )}
                
                {/* Action Row */}`
);

// 11. Adjust Live Preview for SVG output
content = content.replace(
  /storageRestored && previewUrl && !previewError/g,
  `(storageRestored && previewUrl && !previewError) || (mode === "raster-to-svg" && result && result.data)`
);

content = content.replace(
  /src=\{previewUrl\}/,
  `src={mode === "raster-to-svg" && result && result.data ? \`data:image/svg+xml;base64,\${btoa(result.data)}\` : previewUrl}`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored ConverterUI.tsx for Raster-to-SVG mode.');
