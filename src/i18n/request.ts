import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== "object") return target;
  if (!target || typeof target !== "object") return source;

  const result = Array.isArray(target) ? [...target] : { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import(`../../messages/en.json`)).default;

  let messages = enMessages;
  if (locale !== "en") {
    try {
      const localeMessages = (await import(`../../messages/${locale}.json`)).default;
      messages = deepMerge(enMessages, localeMessages);
    } catch {
      messages = enMessages;
    }
  }

  return {
    locale,
    messages,
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] ${error.message}`);
      }
    },
    getMessageFallback({ namespace, key }) {
      return namespace ? `${namespace}.${key}` : key;
    },
  };
});
