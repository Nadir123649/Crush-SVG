import fs from "fs";
import path from "path";

const LOCALES = ["en", "es", "de", "fr", "pt", "ja"];
const MESSAGES_DIR = path.resolve("messages");

const translations = {
  en: {
    tool_pages: {
      developerApi: {
        title: "Developer API Keys & Access",
        h1: "Developer API Keys & REST Access",
        subtitle: "Generate and manage secret API keys to integrate high-performance SVG conversion, vectorization, and background removal directly into your applications.",
      },
    },
  },
  es: {
    tool_pages: {
      developerApi: {
        title: "Claves de API de Desarrollador",
        h1: "Claves de API y Acceso REST para Desarrolladores",
        subtitle: "Genera y administra claves secretas de API para integrar conversión SVG, vectorización y eliminación de fondo en tus aplicaciones.",
      },
    },
  },
  de: {
    tool_pages: {
      developerApi: {
        title: "Entwickler API-Schlüssel",
        h1: "Entwickler API-Schlüssel & REST-Zugriff",
        subtitle: "Erstellen und verwalten Sie API-Schlüssel, um SVG-Konvertierung, Vektorisierung und Freistellen direkt in Ihre Anwendungen zu integrieren.",
      },
    },
  },
  fr: {
    tool_pages: {
      developerApi: {
        title: "Clés API Développeur",
        h1: "Clés API et Accès REST Développeur",
        subtitle: "Générez et gérez des clés secrètes d'API pour intégrer la conversion SVG, la vectorisation et le détourage dans vos applications.",
      },
    },
  },
  pt: {
    tool_pages: {
      developerApi: {
        title: "Chaves de API para Desenvolvedores",
        h1: "Chaves de API e Acesso REST para Desenvolvedores",
        subtitle: "Gere e gerencie chaves secretas de API para integrar conversão SVG, vetorização e remoção de fundo em suas aplicações.",
      },
    },
  },
  ja: {
    tool_pages: {
      developerApi: {
        title: "開発者用APIキー・RESTアクセス",
        h1: "開発者用 APIキー ＆ RESTアクセス",
        subtitle: "SVG変換、ベクター化、背景透過機能をアプリケーションに直接統合するためのAPIキーを発行・管理します。",
      },
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const merged = deepMerge(data, translations[locale]);
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(`Updated ${locale}.json successfully.`);
}
