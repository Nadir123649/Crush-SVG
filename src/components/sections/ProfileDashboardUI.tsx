"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/client/auth-context";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/lib/client/toast-bridge";
import { authFetch } from "@/lib/client/http";
import { IMAGES } from "@/lib/shared/images";

export function ProfileDashboardUI() {
  const t = useTranslations("profile_dashboard");
  const tAuth = useTranslations("auth");
  const tUpload = useTranslations("upload_interface");
  const { user, status } = useAuth();

  const [apiKey, setApiKey] = useState<string | null>(user?.apiKey ?? null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isRevokingKey, setIsRevokingKey] = useState(false);

  // Playground Options
  const [selectedEndpoint, setSelectedEndpoint] = useState<"convert" | "vectorize" | "bgRemove" | "usage">("convert");
  const [selectedLang, setSelectedLang] = useState<"curl" | "js" | "python" | "php">("curl");

  const conversionsUsed = user?.conversionsUsed ?? 0;
  const quota = user?.apiMonthlyQuota ?? 1000;
  const remaining = Math.max(0, quota - conversionsUsed);
  const usagePercent = Math.min(100, Math.round((conversionsUsed / quota) * 100));

  async function handleGenerateApiKey() {
    setIsGeneratingKey(true);
    try {
      const res = await authFetch("/api/v1/profile/api-key", {
        method: "POST",
      });

      if (!res.ok) {
        showToast("error", t("keyGenerateFailed"));
        return;
      }

      const json = (await res.json()) as { data?: { apiKey?: string } };
      if (json.data?.apiKey) {
        setApiKey(json.data.apiKey);
        setShowApiKey(true);
        showToast("success", t("keyGeneratedSuccess"));
      }
    } catch {
      showToast("error", t("keyGenerateFailed"));
    } finally {
      setIsGeneratingKey(false);
    }
  }

  async function handleRevokeApiKey() {
    if (!confirm(t("revokeConfirm"))) return;
    setIsRevokingKey(true);
    try {
      const res = await authFetch("/api/v1/profile/api-key", {
        method: "DELETE",
      });

      if (!res.ok) {
        showToast("error", t("revokeFailed"));
        return;
      }

      setApiKey(null);
      setShowApiKey(false);
      showToast("success", t("keyRevokedSuccess"));
    } catch {
      showToast("error", t("revokeFailed"));
    } finally {
      setIsRevokingKey(false);
    }
  }

  async function handleCopyApiKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      showToast("success", t("apiKeyCopied"));
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  async function handleCopyBaseUrl() {
    try {
      await navigator.clipboard.writeText("https://crushsvg.net/api/v1");
      setCopiedBaseUrl(true);
      setTimeout(() => setCopiedBaseUrl(false), 2000);
      showToast("success", "API Base URL copied to clipboard!");
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  const sampleKey = apiKey || "crush_live_your_secret_api_key_here";

  const codeSnippets: Record<string, Record<string, string>> = {
    convert: {
      curl: `curl -X POST https://crushsvg.net/api/v1/convert \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\" fill=\\"#D94A1E\\"/></svg>",
    "targetWidth": 1024,
    "targetHeight": 1024,
    "format": "png"
  }'`,
      js: `// Convert SVG to PNG via CrushSVG REST API
const response = await fetch("https://crushsvg.net/api/v1/convert", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    svg: "<svg viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='#D94A1E'/></svg>",
    targetWidth: 1024,
    targetHeight: 1024
  })
});

const data = await response.json();
console.log("Download URL:", data.payload.downloadUrl);`,
      python: `import requests

# Convert SVG to PNG via CrushSVG REST API
url = "https://crushsvg.net/api/v1/convert"
headers = {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
}
payload = {
    "svg": "<svg viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='#D94A1E'/></svg>",
    "targetWidth": 1024,
    "targetHeight": 1024
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      php: `<?php
// Convert SVG to PNG via CrushSVG REST API
$ch = curl_init('https://crushsvg.net/api/v1/convert');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${sampleKey}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'svg' => '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#D94A1E"/></svg>',
    'targetWidth' => 1024,
    'targetHeight' => 1024
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

echo $result;
?>`,
    },
    vectorize: {
      curl: `curl -X POST https://crushsvg.net/api/v1/vectorize \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -F "image=@icon.png" \\
  -F "colorMode=color" \\
  -F "filterSpeckle=4"`,
      js: `// Vectorize bitmap image into scalable SVG
const formData = new FormData();
formData.append("image", fileInput.files[0]);
formData.append("colorMode", "color");

const response = await fetch("https://crushsvg.net/api/v1/vectorize", {
  method: "POST",
  headers: { "Authorization": "Bearer ${sampleKey}" },
  body: formData
});

const result = await response.json();
console.log("SVG Vector:", result.payload.svgContent);`,
      python: `import requests

# Vectorize bitmap image into scalable SVG
url = "https://crushsvg.net/api/v1/vectorize"
headers = {"Authorization": "Bearer ${sampleKey}"}
files = {"image": open("icon.png", "rb")}
data = {"colorMode": "color", "filterSpeckle": 4}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())`,
      php: `<?php
$ch = curl_init('https://crushsvg.net/api/v1/vectorize');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${sampleKey}']);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'image' => new CURLFile('icon.png'),
    'colorMode' => 'color'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`,
    },
    bgRemove: {
      curl: `curl -X POST https://crushsvg.net/api/v1/background-remove \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -F "image=@photo.jpg"`,
      js: `// Neural AI Background Removal
const formData = new FormData();
formData.append("image", fileInput.files[0]);

const response = await fetch("https://crushsvg.net/api/v1/background-remove", {
  method: "POST",
  headers: { "Authorization": "Bearer ${sampleKey}" },
  body: formData
});

const blob = await response.blob();`,
      python: `import requests

# Neural AI Background Removal
url = "https://crushsvg.net/api/v1/background-remove"
headers = {"Authorization": "Bearer ${sampleKey}"}
files = {"image": open("photo.jpg", "rb")}

response = requests.post(url, headers=headers, files=files)
with open("transparent.png", "wb") as f:
    f.write(response.content)`,
      php: `<?php
$ch = curl_init('https://crushsvg.net/api/v1/background-remove');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${sampleKey}']);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['image' => new CURLFile('photo.jpg')]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
file_put_contents('transparent.png', $res);
?>`,
    },
    usage: {
      curl: `curl -X GET https://crushsvg.net/api/v1/usage \\
  -H "Authorization: Bearer ${sampleKey}"`,
      js: `// Retrieve remaining quota & usage
const res = await fetch("https://crushsvg.net/api/v1/usage", {
  headers: { "Authorization": "Bearer ${sampleKey}" }
});
const { payload } = await res.json();
console.log(\`Used: \${payload.conversionsUsed} / \${payload.remaining} remaining\`);`,
      python: `import requests

response = requests.get(
    "https://crushsvg.net/api/v1/usage",
    headers={"Authorization": "Bearer ${sampleKey}"}
)
print(response.json())`,
      php: `<?php
$ch = curl_init('https://crushsvg.net/api/v1/usage');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${sampleKey}']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
echo curl_exec($ch);
curl_close($ch);
?>`,
    },
  };

  async function handleCopySnippet() {
    try {
      const code = codeSnippets[selectedEndpoint][selectedLang];
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast("success", t("snippetCopied"));
    } catch {
      showToast("error", t("copyFailed"));
    }
  }

  return (
    <section
      id="converter"
      className="w-full max-w-[362px] md:max-w-[720px] lg:max-w-[1280px] mx-auto mt-[30px] md:mt-[48px] mb-[60px] md:mb-[100px] scroll-mt-[70px] md:scroll-mt-[96px]"
    >
      {/* Outer Dashed Border Box */}
      <div className="w-full h-auto border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[32px] p-0 md:p-[12px] transition-all duration-300 lg:min-h-[500px]">
        {/* Inner Dashed Border Box */}
        <div className="w-full h-auto bg-transparent md:bg-[#FFFFFF] border-none md:border md:border-dashed md:border-[#8F8F8F] rounded-none md:rounded-[24px] flex flex-col justify-center px-0 md:px-[40px] py-[20px] transition-all duration-300 lg:min-h-[476px]">
          {/* Top row with columns */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-center w-full gap-[24px] md:gap-[30px]">
            
            {/* Left Column (API Key Vault & Quota Progress) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  {t("apiKeySectionTitle")}
                </h2>
                <div className="flex items-center gap-[10px]">
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleGenerateApiKey}
                      disabled={isGeneratingKey}
                      className="group relative rounded-[6px] px-[12px] py-[4px] font-body font-medium text-[12px] overflow-hidden transition-opacity duration-300 opacity-100 cursor-pointer disabled:opacity-50"
                    >
                      <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                          border: "1px solid transparent",
                          background:
                            "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
                          borderRadius: "inherit",
                        }}
                      />
                      <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D]" />
                      <span className="relative z-10 text-[#D94A1E] group-hover:text-white transition-colors duration-300 ease-in-out">
                        {isGeneratingKey ? t("generating") : "Rotate Key"}
                      </span>
                    </button>
                  )}
                  <span className="font-mono text-[12px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    REST v1
                  </span>
                </div>
              </div>

              {/* Secret API Key Box */}
              <div className="relative w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden p-4 flex flex-col justify-between focus-within:border-brand-primary transition-colors">
                {apiKey ? (
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-semibold text-[13px] text-text-dark">
                          Secret Token
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="font-body text-[12px] text-brand-primary hover:underline cursor-pointer"
                        >
                          {showApiKey ? t("hideKey") : t("showKey")}
                        </button>
                      </div>

                      <div className="w-full bg-[#FAF6F3] border border-[#E8DED7] rounded-[10px] p-3 font-mono text-[13px] text-text-dark break-all select-all">
                        {showApiKey ? apiKey : `${apiKey.slice(0, 14)}••••••••••••••••••••••••••••••••`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-[#F2EDE8]">
                      <div className="flex items-center justify-between text-[12px] font-body text-[#64748B]">
                        <span>Header format:</span>
                        <code className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-text-dark">
                          Authorization: Bearer &lt;token&gt;
                        </code>
                      </div>
                      <div className="flex items-center justify-between text-[12px] font-body text-[#64748B]">
                        <span>Alternative:</span>
                        <code className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded text-text-dark">
                          X-API-Key: &lt;token&gt;
                        </code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="font-body text-[13px] text-text-muted mb-4 max-w-[320px]">
                      {t("noKeyPrompt")}
                    </p>
                    <Button
                      variant="solid"
                      onClick={handleGenerateApiKey}
                      disabled={isGeneratingKey}
                      className="w-[200px] h-[40px] text-[13px] rounded-[10px]"
                    >
                      {isGeneratingKey ? t("generating") : t("generateKeyBtn")}
                    </Button>
                  </div>
                )}

                {apiKey && (
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    aria-label={copiedKey ? t("copied") : t("copyKey")}
                    title={copiedKey ? t("copied") : t("copyKey")}
                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-white border border-[#E2E8F0] hover:border-brand-primary text-[#475569] hover:text-brand-primary rounded-[6px] p-1 md:p-1.5 flex items-center justify-center z-30 shadow-xs cursor-pointer transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Monthly Quota & Limits Card (Dashed Box matching Dropzone) */}
              <div className="w-full h-[150px] md:h-[167px] rounded-[16px] border border-dashed border-[#8F8F8F] bg-[#FFFFFF] p-[20px] md:p-[24px] mt-[16px] md:mt-[20px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-[14px] text-text-dark">
                    {t("monthlyUsageTitle")}
                  </span>
                  <span className="font-mono text-[12px] font-medium text-brand-primary bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    {conversionsUsed} / {quota}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] rounded-full transition-all duration-500"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-body text-[#64748B]">
                    <span>{t("usedPercent", { percent: usagePercent })}</span>
                    <span>{remaining} conversions remaining</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#F2EDE8]">
                  <span className="font-body text-[12px] text-[#64748B]">
                    Rate limit: <strong className="text-text-dark">100 req/min</strong>
                  </span>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleRevokeApiKey}
                      disabled={isRevokingKey}
                      className="font-body text-[12px] text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      {isRevokingKey ? t("revoking") : t("revokeKey")}
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Source Text & Privacy */}
              <p className="font-body font-normal text-[12px] md:text-[14px] text-[#475569] mt-[12px] md:mt-[10px]">
                Base Gateway: <code className="font-mono text-[12px] text-brand-primary bg-[#FAF6F3] px-1 py-0.5 rounded">https://crushsvg.net/api/v1</code>
              </p>

              <div className="mt-[16px] lg:mt-auto flex flex-col w-full">
                <p className="font-body text-[12px] md:text-[14px] text-[#475569] flex items-center justify-start gap-[6px]">
                  <Image src={IMAGES.lock} alt="Lock" width={12} height={12} className="shrink-0 w-[12px] h-[12px]" style={{ width: "auto", height: "auto" }} />
                  <span>Your API key is encrypted at rest. Never expose secret keys in client-side repositories.</span>
                </p>
              </div>
            </div>

            {/* Right Column (Live Integration Code & Endpoint Picker) */}
            <div className="w-full lg:w-[537px] flex flex-col">
              {/* Header with Language Tabs */}
              <div className="flex items-center justify-between mb-[12px] h-[36px]">
                <h2 className="font-heading font-semibold text-[16px] text-[#475569]">
                  Live Integration Code
                </h2>
                <div className="flex items-center gap-[4px] bg-[#F1F5F9] p-[3px] rounded-[8px]">
                  {(["curl", "js", "python", "php"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLang(lang)}
                      className={`px-[8px] py-[3px] rounded-[6px] font-mono text-[11px] font-medium transition-all cursor-pointer ${
                        selectedLang === lang
                          ? "bg-white text-brand-primary shadow-xs font-bold"
                          : "text-[#64748B] hover:text-text-dark"
                      }`}
                    >
                      {lang === "js" ? "Node" : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Box */}
              <div className="relative w-full h-[200px] md:h-[302px] rounded-[16px] border border-[#8F8F8F] bg-[#FFFFFF] overflow-hidden focus-within:border-brand-primary transition-colors">
                <pre className="w-full h-full p-3 md:p-4 outline-none border-none bg-transparent font-mono text-[12.5px] leading-[1.6] text-black whitespace-pre overflow-auto brand-scrollbar">
                  {codeSnippets[selectedEndpoint][selectedLang]}
                </pre>
                <div className="absolute bottom-0 left-0 right-[16px] h-[13px] md:h-[21px] bg-[#FFFFFF] pointer-events-none rounded-bl-[16px]" />
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  aria-label={copiedCode ? t("copied") : t("copyCode")}
                  title={copiedCode ? t("copied") : t("copyCode")}
                  className="absolute top-2 right-2 md:top-3 md:right-3 bg-white border border-[#E2E8F0] hover:border-brand-primary text-[#475569] hover:text-brand-primary rounded-[6px] p-1 md:p-1.5 flex items-center justify-center z-30 shadow-xs cursor-pointer transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>

              {/* Endpoint Picker Box */}
              <div className="w-full mt-[16px] md:mt-[20px] grow shrink-0 flex flex-col justify-between">
                <div className="p-[14px] md:p-[16px] bg-white rounded-[14px] border border-[#8F8F8F] flex flex-col gap-[10px]">
                  <h3 className="font-heading font-semibold text-[14px] text-text-dark">
                    Select Target API Endpoint
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-[8px] text-[12px] md:text-[13px] font-body text-[#475569]">
                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={selectedEndpoint === "convert"}
                        onChange={() => setSelectedEndpoint("convert")}
                        className="accent-brand-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">POST /convert (SVG to PNG)</span>
                    </label>

                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={selectedEndpoint === "vectorize"}
                        onChange={() => setSelectedEndpoint("vectorize")}
                        className="accent-brand-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">POST /vectorize (Bitmap to SVG)</span>
                    </label>

                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={selectedEndpoint === "bgRemove"}
                        onChange={() => setSelectedEndpoint("bgRemove")}
                        className="accent-brand-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">POST /background-remove</span>
                    </label>

                    <label className="flex items-center gap-[8px] cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={selectedEndpoint === "usage"}
                        onChange={() => setSelectedEndpoint("usage")}
                        className="accent-brand-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">GET /usage</span>
                    </label>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="flex flex-wrap items-center gap-[8px] mt-[12px]">
                  <Link
                    href="/api-docs"
                    className="grow py-[8px] px-[12px] rounded-[10px] bg-white border border-[#CBD5E1] hover:border-brand-primary text-text-dark hover:text-brand-primary text-[12px] md:text-[13px] font-body font-medium text-center transition-colors cursor-pointer shadow-xs"
                  >
                    Open Swagger UI Playground ↗
                  </Link>
                  <button
                    type="button"
                    onClick={handleCopyBaseUrl}
                    className="grow py-[8px] px-[12px] rounded-[10px] bg-white border border-[#CBD5E1] hover:border-brand-primary text-text-dark hover:text-brand-primary text-[12px] md:text-[13px] font-body font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedBaseUrl ? "Base URL Copied!" : "Copy Base URL"}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Primary Action Button */}
          <div className="w-full flex justify-center mt-[30px] md:mt-[40px]">
            <Button
              href="/api-docs"
              variant="solid"
              className="w-[300px] h-[44px] md:h-[48px] rounded-[14px] text-[15px] md:text-[16px] font-medium tracking-[0.02em] shadow-[0px_4px_14px_0px_rgba(217,74,30,0.3)] hover:shadow-[0px_6px_20px_0px_rgba(217,74,30,0.4)] transition-all cursor-pointer"
            >
              Interactive API Reference ↗
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
