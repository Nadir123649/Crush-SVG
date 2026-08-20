export function parseUserAgent(ua: string | null): {
    browser: string;
    os: string;
    deviceType: string;
} {
    if (!ua)
        return { browser: "Unknown", os: "Unknown", deviceType: "unknown" };
    let browser = "Unknown";
    if (ua.includes("Firefox") || ua.includes("FxiOS"))
        browser = "Firefox";
    else if (ua.includes("SamsungBrowser"))
        browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR"))
        browser = "Opera";
    else if (ua.includes("Trident") || ua.includes("MSIE"))
        browser = "Internet Explorer";
    else if (ua.includes("Edge") || ua.includes("Edg"))
        browser = "Edge";
    else if (ua.includes("Chrome") || ua.includes("CriOS"))
        browser = "Chrome";
    else if (ua.includes("Safari"))
        browser = "Safari";
    let os = "Unknown";
    if (ua.includes("Windows"))
        os = "Windows";
    else if (ua.includes("Mac OS X"))
        os = "Mac OS";
    else if (ua.includes("Android"))
        os = "Android";
    else if (ua.includes("Linux"))
        os = "Linux";
    else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
        os = "iOS";
    let deviceType = "desktop";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Opera M(obi|ini)/i.test(ua)) {
        deviceType = "mobile";
    }
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = "tablet";
    }
    return { browser, os, deviceType };
}
