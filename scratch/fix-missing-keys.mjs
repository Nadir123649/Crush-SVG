import fs from "fs";
import path from "path";

const LOCALES = ["en", "es", "de", "fr", "pt", "ja"];
const MESSAGES_DIR = path.resolve("messages");

const patch = {
  en: {
    toasts: {
      accountCreatedSuccess: "Account created! Please check your email to verify your account.",
      somethingWentWrong: "Something went wrong. Please try again.",
      resendLinkSuccess: "Verification email sent successfully.",
      couldNotResend: "Could not resend verification email. Please try again.",
    },
    svg_optimizer_ui: {
      codeCopied: "Optimized SVG copied to clipboard!",
      dataUriCopied: "Data URI copied to clipboard!",
    },
    upload_interface: {
      dragDrop: "Drag & drop your file here, or",
      browse: "browse",
      supportedFormats: "Supports SVG, PNG, JPG, WebP — Max 10MB",
    },
  },
  es: {
    toasts: {
      accountCreatedSuccess: "¡Cuenta creada! Revisa tu correo para verificar tu cuenta.",
      somethingWentWrong: "Algo salió mal. Por favor inténtalo de nuevo.",
      resendLinkSuccess: "Correo de verificación reenviado con éxito.",
      couldNotResend: "No se pudo reenviar el correo de verificación.",
    },
    svg_optimizer_ui: {
      codeCopied: "¡SVG optimizado copiado al portapapeles!",
      dataUriCopied: "¡Data URI copiado al portapapeles!",
    },
    upload_interface: {
      dragDrop: "Arrastra y suelta tu archivo aquí, o",
      browse: "explora",
      supportedFormats: "Admite SVG, PNG, JPG, WebP — Máx 10MB",
    },
  },
  de: {
    toasts: {
      accountCreatedSuccess: "Konto erstellt! Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.",
      somethingWentWrong: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
      resendLinkSuccess: "Bestätigungs-E-Mail erfolgreich erneut gesendet.",
      couldNotResend: "Bestätigungs-E-Mail konnte nicht erneut gesendet werden.",
    },
    svg_optimizer_ui: {
      codeCopied: "Optimiertes SVG in die Zwischenablage kopiert!",
      dataUriCopied: "Data-URI in die Zwischenablage kopiert!",
    },
    upload_interface: {
      dragDrop: "Datei hierher ziehen oder",
      browse: "durchsuchen",
      supportedFormats: "Unterstützt SVG, PNG, JPG, WebP — Max 10MB",
    },
  },
  fr: {
    toasts: {
      accountCreatedSuccess: "Compte créé ! Veuillez vérifier vos e-mails pour valider votre compte.",
      somethingWentWrong: "Une erreur est survenue. Veuillez réessayer.",
      resendLinkSuccess: "E-mail de vérification renvoyé avec succès.",
      couldNotResend: "Impossible de renvoyer l'e-mail de vérification.",
    },
    svg_optimizer_ui: {
      codeCopied: "SVG optimisé copié dans le presse-papier !",
      dataUriCopied: "Data URI copié dans le presse-papier !",
    },
    upload_interface: {
      dragDrop: "Glissez-déposez votre fichier ici, ou",
      browse: "parcourir",
      supportedFormats: "Prend en charge SVG, PNG, JPG, WebP — Max 10 Mo",
    },
  },
  pt: {
    toasts: {
      accountCreatedSuccess: "Conta criada! Verifique seu e-mail para confirmar sua conta.",
      somethingWentWrong: "Algo deu errado. Por favor, tente novamente.",
      resendLinkSuccess: "E-mail de verificação reenviado com sucesso.",
      couldNotResend: "Não foi possível reenviar o e-mail de verificação.",
    },
    svg_optimizer_ui: {
      codeCopied: "SVG otimizado copiado para a área de transferência!",
      dataUriCopied: "Data URI copiado para a área de transferência!",
    },
    upload_interface: {
      dragDrop: "Arraste e solte seu arquivo aqui, ou",
      browse: "procure",
      supportedFormats: "Suporta SVG, PNG, JPG, WebP — Máx 10MB",
    },
  },
  ja: {
    toasts: {
      accountCreatedSuccess: "アカウントが作成されました。メールを確認して認証を完了してください。",
      somethingWentWrong: "問題が発生しました。もう一度お試しください。",
      resendLinkSuccess: "認証メールを再送しました。",
      couldNotResend: "認証メールを再送できませんでした。",
    },
    svg_optimizer_ui: {
      codeCopied: "最適化されたSVGをクリップボードにコピーしました！",
      dataUriCopied: "Data URIをクリップボードにコピーしました！",
    },
    upload_interface: {
      dragDrop: "ファイルをドラッグ＆ドロップまたは",
      browse: "ファイルを選択",
      supportedFormats: "SVG, PNG, JPG, WebP 対応 — 最大 10MB",
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

  const merged = deepMerge(data, patch[locale]);
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(`Updated ${locale}.json with missing keys.`);
}
