import fs from "fs";
import path from "path";

const locales = ["en", "es", "de", "fr", "pt", "ja"];

const newTranslations = {
  en: {
    navigation: {
      svgToReact: "SVG to React",
    },
    footer: {
      svgToReact: "SVG to React",
    },
    SEO: {
      svgToReactTitle: "Convert SVG to React JSX/TSX, Vue, Svelte & React Native Components Online",
      svgToReactDescription: "Free online SVG to Code generator. Instantly transform SVG vectors into clean, type-safe React (TSX/JSX), Vue 3, Svelte, Tailwind, and React Native components with currentColor support.",
    },
    tool_pages: {
      svgToReact: {
        h1: "Convert SVG to React & Vue Components",
        subtitle: "Instantly turn raw SVG files into production-ready TypeScript & JavaScript frontend components with currentColor support.",
      },
    },
    svg_to_code_ui: {
      editorTitle: "SVG to Component Compiler",
      liveCompilerBadge: "Live Preview & Fast",
      editorSubtitle: "Upload or paste any SVG markup to generate clean React TSX, JSX, Vue 3, Svelte, Tailwind, or React Native components.",
      presetsLabel: "Presets",
      svgOnlyNote: "Supports .SVG vector files up to 10MB",
      livePreview: "Visual Preview",
      clearInput: "Clear SVG",
      rawSvgLabel: "Raw SVG Source Code",
      componentNameLabel: "Component Name",
      useCurrentColor: "Replace fills/strokes with currentColor",
      generatedCodeLabel: "Generated Component Code",
      copied: "Copied!",
      copyCode: "Copy Code",
      downloadFile: "Download Component",
      invalidSvgFile: "Please select a valid SVG file (.svg)",
      fileTooLarge: "File exceeds the 10MB limit.",
      fileLoaded: "SVG loaded successfully.",
      fileReadError: "Could not read SVG file content.",
      codeCopied: "Component code copied to clipboard!",
      copyFailed: "Failed to copy to clipboard.",
      fileDownloaded: "Component file downloaded successfully.",
    },
    features: {
      reactTitle: "Transform Vectors into Production Code without juggling design tools",
      reactDesc: "Generate clean, modern, and accessible frontend components from your SVG vectors in milliseconds.",
      badgeTypeScriptReady: "TypeScript & TSX Ready",
      badgeFrameworkSupport: "React, Vue & Svelte",
      badgeLucideStyle: "Lucide & Heroicons Props",
    },
    steps: {
      react: [
        {
          title: "Upload or Paste SVG",
          description: "Drop your .svg file into the workspace or paste raw SVG markup directly into the code box.",
        },
        {
          title: "Pick Your Framework",
          description: "Select React (TSX/JSX), Vue 3, Svelte, Tailwind, or React Native, and customize the component name.",
        },
        {
          title: "Copy or Download",
          description: "1-click copy clean, production-ready component code or download the component file directly.",
        },
      ],
    },
    FAQ: {
      react: [
        {
          question: "How does the SVG to React component converter work?",
          answer: "CrushSVG parses your raw SVG markup in the browser, converts kebab-case SVG attributes to React camelCase JSX properties, formats inline styles into style objects, and wraps the SVG in a typed, customizable component interface.",
        },
        {
          question: "Can I use the generated component in Next.js and Vite?",
          answer: "Yes! The generated React (TSX/JSX) components work seamlessly with Next.js App Router, Pages Router, Vite, Create React App, Remix, and Astro.",
        },
        {
          question: "What does the 'currentColor' option do?",
          answer: "When enabled, hardcoded fill and stroke colors in your SVG are replaced with 'currentColor'. This allows the icon to automatically inherit text colors from Tailwind CSS classes (e.g. text-blue-500) or CSS color properties.",
        },
        {
          question: "Is my SVG code stored on your servers?",
          answer: "No. All component generation and parsing happens 100% locally in your browser using client-side JavaScript. Your designs and code remain completely private.",
        },
      ],
    },
  },
  es: {
    navigation: {
      svgToReact: "SVG a React",
    },
    footer: {
      svgToReact: "SVG a React",
    },
    SEO: {
      svgToReactTitle: "Convertir SVG a Componentes React JSX/TSX, Vue y Svelte Online",
      svgToReactDescription: "Generador gratuito de SVG a código online. Convierte vectores SVG en componentes React (TSX/JSX), Vue 3, Svelte y React Native seguros con soporte para currentColor.",
    },
    tool_pages: {
      svgToReact: {
        h1: "Convertir SVG a Componentes React",
        subtitle: "Convierte instantáneamente archivos SVG en componentes frontend listos para producción con soporte para currentColor.",
      },
    },
    svg_to_code_ui: {
      editorTitle: "Compilador de SVG a Componentes",
      liveCompilerBadge: "Vista Previa en Vivo",
      editorSubtitle: "Sube o pega código SVG para generar componentes limpios de React TSX, JSX, Vue 3, Svelte, Tailwind o React Native.",
      presetsLabel: "Ejemplos",
      svgOnlyNote: "Admite archivos vectoriales .SVG de hasta 10MB",
      livePreview: "Vista Previa Visual",
      clearInput: "Limpiar SVG",
      rawSvgLabel: "Código Fuente SVG",
      componentNameLabel: "Nombre del Componente",
      useCurrentColor: "Reemplazar colores con currentColor",
      generatedCodeLabel: "Código de Componente Generado",
      copied: "¡Copiado!",
      copyCode: "Copiar Código",
      downloadFile: "Descargar Componente",
      invalidSvgFile: "Por favor selecciona un archivo SVG válido (.svg)",
      fileTooLarge: "El archivo supera el límite de 10MB.",
      fileLoaded: "SVG cargado correctamente.",
      fileReadError: "No se pudo leer el archivo SVG.",
      codeCopied: "¡Código de componente copiado al portapapeles!",
      copyFailed: "Error al copiar al portapapeles.",
      fileDownloaded: "Archivo de componente descargado correctamente.",
    },
    features: {
      reactTitle: "Transforma Vectores en Código sin programas complejos",
      reactDesc: "Genera componentes frontend limpios, modernos y accesibles a partir de tus vectores SVG en milisegundos.",
      badgeTypeScriptReady: "Listo para TypeScript & TSX",
      badgeFrameworkSupport: "React, Vue y Svelte",
      badgeLucideStyle: "Estilo Lucide y Heroicons",
    },
    steps: {
      react: [
        {
          title: "Sube o Pega tu SVG",
          description: "Arrastra tu archivo .svg al área de trabajo o pega el código SVG directamente.",
        },
        {
          title: "Elige tu Framework",
          description: "Selecciona React (TSX/JSX), Vue 3, Svelte, Tailwind o React Native y personaliza el nombre.",
        },
        {
          title: "Copia o Descarga",
          description: "Copia el código limpio en 1 clic o descarga el archivo del componente listo para usar.",
        },
      ],
    },
    FAQ: {
      react: [
        {
          question: "¿Cómo funciona el conversor de SVG a React?",
          answer: "CrushSVG procesa el SVG directamente en tu navegador, convierte atributos a camelCase de JSX y genera un componente tipado y reutilizable.",
        },
        {
          question: "¿Puedo usar el componente en Next.js y Vite?",
          answer: "¡Sí! Los componentes generados son compatibles con Next.js (App Router), Vite, Astro y Remix.",
        },
        {
          question: "¿Qué hace la opción 'currentColor'?",
          answer: "Reemplaza los colores fijos con currentColor para que el icono herede dinámicamente las clases de color de Tailwind CSS (como text-blue-500).",
        },
        {
          question: "¿Mis archivos se guardan en sus servidores?",
          answer: "No. Todo el procesamiento se realiza 100% en tu navegador de forma privada y segura.",
        },
      ],
    },
  },
  de: {
    navigation: {
      svgToReact: "SVG in React",
    },
    footer: {
      svgToReact: "SVG in React",
    },
    SEO: {
      svgToReactTitle: "SVG in React JSX/TSX, Vue & Svelte Komponenten online umwandeln",
      svgToReactDescription: "Kostenloser SVG-zu-Code-Generator. Verwandeln Sie SVG-Vektoren sofort in typsichere React-, Vue 3-, Svelte- und React Native-Komponenten.",
    },
    tool_pages: {
      svgToReact: {
        h1: "SVG in React-Komponenten umwandeln",
        subtitle: "Verwandeln Sie SVG-Dateien sofort in produktionsbereite Frontend-Komponenten mit currentColor-Unterstützung.",
      },
    },
    svg_to_code_ui: {
      editorTitle: "SVG-zu-Komponenten Compiler",
      liveCompilerBadge: "Live-Vorschau",
      editorSubtitle: "SVG hochladen oder einfügen und sauberen React TSX, JSX, Vue 3, Svelte oder Tailwind Code erzeugen.",
      presetsLabel: "Vorlagen",
      svgOnlyNote: "Unterstützt .SVG-Vektordateien bis zu 10MB",
      livePreview: "Visuelle Vorschau",
      clearInput: "SVG löschen",
      rawSvgLabel: "SVG-Quellcode",
      componentNameLabel: "Komponentenname",
      useCurrentColor: "Farben durch currentColor ersetzen",
      generatedCodeLabel: "Generierter Komponentencode",
      copied: "Kopiert!",
      copyCode: "Code kopieren",
      downloadFile: "Komponente herunterladen",
      invalidSvgFile: "Bitte wählen Sie eine gültige SVG-Datei (.svg)",
      fileTooLarge: "Die Datei überschreitet das Limit von 10MB.",
      fileLoaded: "SVG erfolgreich geladen.",
      fileReadError: "SVG-Datei konnte nicht gelesen werden.",
      codeCopied: "Komponentencode in die Zwischenablage kopiert!",
      copyFailed: "Kopieren fehlgeschlagen.",
      fileDownloaded: "Komponentendatei erfolgreich heruntergeladen.",
    },
    features: {
      reactTitle: "Vektoren in produktionsreifen Code verwandeln ohne überladener Software",
      reactDesc: "Erstellen Sie saubere, moderne und barrierefreie Frontend-Komponenten aus Ihren SVGs in Millisekunden.",
      badgeTypeScriptReady: "TypeScript & TSX bereit",
      badgeFrameworkSupport: "React, Vue & Svelte",
      badgeLucideStyle: "Lucide & Heroicons Props",
    },
    steps: {
      react: [
        {
          title: "SVG hochladen oder einfügen",
          description: "Ziehen Sie Ihre .svg-Datei in den Arbeitsbereich oder fügen Sie den SVG-Code ein.",
        },
        {
          title: "Framework auswählen",
          description: "Wählen Sie React (TSX/JSX), Vue 3, Svelte oder Tailwind und passen Sie den Namen an.",
        },
        {
          title: "Kopieren oder herunterladen",
          description: "Kopieren Sie den Code mit 1 Klick oder laden Sie die Komponentendatei herunter.",
        },
      ],
    },
    FAQ: {
      react: [
        {
          question: "Wie funktioniert der SVG-zu-React-Konverter?",
          answer: "CrushSVG analysiert Ihr SVG im Browser, wandelt HTML-Attribute in camelCase um und erzeugt eine typsichere React-Komponente.",
        },
        {
          question: "Funktioniert der Code in Next.js und Vite?",
          answer: "Ja, der generierte Code ist vollständig kompatibel mit Next.js, Vite, Remix und Astro.",
        },
        {
          question: "Was bewirkt die currentColor-Option?",
          answer: "Feste Farben werden durch currentColor ersetzt, sodass Icons automatisch die Schriftfarbe von CSS/Tailwind übernehmen.",
        },
        {
          question: "Werden meine SVGs auf Ihren Servern gespeichert?",
          answer: "Nein, alle Transformationen finden 100% lokal in Ihrem Browser statt.",
        },
      ],
    },
  },
  fr: {
    navigation: {
      svgToReact: "SVG en React",
    },
    footer: {
      svgToReact: "SVG en React",
    },
    SEO: {
      svgToReactTitle: "Convertir SVG en Composants React JSX/TSX, Vue et Svelte en Ligne",
      svgToReactDescription: "Générateur SVG vers Code gratuit. Transformez instantanément vos fichiers SVG en composants React (TSX/JSX), Vue 3, Svelte et React Native.",
    },
    tool_pages: {
      svgToReact: {
        h1: "Convertir SVG en Composants React",
        subtitle: "Transformez instantanément vos fichiers SVG en composants frontend TypeScript et JavaScript avec support de currentColor.",
      },
    },
    svg_to_code_ui: {
      editorTitle: "Compilateur SVG en Composants",
      liveCompilerBadge: "Aperçu en Direct",
      editorSubtitle: "Téléversez ou collez du SVG pour générer des composants propres React TSX, JSX, Vue 3, Svelte, Tailwind ou React Native.",
      presetsLabel: "Exemples",
      svgOnlyNote: "Prend en charge les fichiers vectoriels .SVG jusqu'à 10 Mo",
      livePreview: "Aperçu Visuel",
      clearInput: "Effacer SVG",
      rawSvgLabel: "Code Source SVG",
      componentNameLabel: "Nom du Composant",
      useCurrentColor: "Remplacer les couleurs par currentColor",
      generatedCodeLabel: "Code du Composant Généré",
      copied: "Copié !",
      copyCode: "Copier le Code",
      downloadFile: "Télécharger le Composant",
      invalidSvgFile: "Veuillez sélectionner un fichier SVG valide (.svg)",
      fileTooLarge: "Le fichier dépasse la limite de 10 Mo.",
      fileLoaded: "SVG chargé avec succès.",
      fileReadError: "Impossible de lire le fichier SVG.",
      codeCopied: "Code du composant copié dans le presse-papier !",
      copyFailed: "Échec de la copie.",
      fileDownloaded: "Fichier de composant téléchargé avec succès.",
    },
    features: {
      reactTitle: "Transformez vos vecteurs en code propre sans logiciels complexes",
      reactDesc: "Générez des composants frontend modernes, typés et accessibles à partir de vos fichiers SVG en quelques millisecondes.",
      badgeTypeScriptReady: "Prêt pour TypeScript & TSX",
      badgeFrameworkSupport: "React, Vue & Svelte",
      badgeLucideStyle: "Props style Lucide & Heroicons",
    },
    steps: {
      react: [
        {
          title: "Téléversez ou Collez le SVG",
          description: "Déposez votre fichier .svg ou collez directement le code source SVG.",
        },
        {
          title: "Choisissez votre Framework",
          description: "Sélectionnez React (TSX/JSX), Vue 3, Svelte ou Tailwind et personnalisez le nom.",
        },
        {
          title: "Copiez ou Téléchargez",
          description: "Copiez le code en 1 clic ou téléchargez le fichier composant prêt pour la production.",
        },
      ],
    },
    FAQ: {
      react: [
        {
          question: "Comment fonctionne le convertisseur SVG vers React ?",
          answer: "CrushSVG analyse le SVG directement dans votre navigateur, convertit les attributs en camelCase et produit un composant React propre et typé.",
        },
        {
          question: "Puis-je l'utiliser avec Next.js et Vite ?",
          answer: "Oui ! Les composants sont compatibles avec Next.js (App Router), Vite, Remix et Astro.",
        },
        {
          question: "Que fait l'option 'currentColor' ?",
          answer: "Elle remplace les couleurs codées en dur par currentColor, permettant à l'icône d'hériter des classes Tailwind (ex. text-blue-500).",
        },
        {
          question: "Mes fichiers sont-ils envoyés sur des serveurs ?",
          answer: "Non. Toute la conversion s'exécute localement dans votre navigateur pour une confidentialité totale.",
        },
      ],
    },
  },
  pt: {
    navigation: {
      svgToReact: "SVG para React",
    },
    footer: {
      svgToReact: "SVG para React",
    },
    SEO: {
      svgToReactTitle: "Converter SVG para Componentes React JSX/TSX, Vue e Svelte Online",
      svgToReactDescription: "Gerador gratuito de SVG para Código. Transforme vetores SVG em componentes React (TSX/JSX), Vue 3, Svelte e React Native com currentColor.",
    },
    tool_pages: {
      svgToReact: {
        h1: "Converter SVG para Componentes React",
        subtitle: "Transforme instantaneamente arquivos SVG em componentes frontend prontos para produção com suporte a currentColor.",
      },
    },
    svg_to_code_ui: {
      editorTitle: "Compilador de SVG para Componentes",
      liveCompilerBadge: "Prévia em Tempo Real",
      editorSubtitle: "Envie ou cole código SVG para gerar componentes limpos em React TSX, JSX, Vue 3, Svelte, Tailwind ou React Native.",
      presetsLabel: "Exemplos",
      svgOnlyNote: "Suporta arquivos vetoriais .SVG de até 10MB",
      livePreview: "Prévia Visual",
      clearInput: "Limpar SVG",
      rawSvgLabel: "Código Fonte SVG",
      componentNameLabel: "Nome do Componente",
      useCurrentColor: "Substituir cores por currentColor",
      generatedCodeLabel: "Código do Componente Gerado",
      copied: "Copiado!",
      copyCode: "Copiar Código",
      downloadFile: "Baixar Componente",
      invalidSvgFile: "Selecione um arquivo SVG válido (.svg)",
      fileTooLarge: "O arquivo excede o limite de 10MB.",
      fileLoaded: "SVG carregado com sucesso.",
      fileReadError: "Não foi possível ler o arquivo SVG.",
      codeCopied: "Código do componente copiado para a área de transferência!",
      copyFailed: "Falha ao copiar.",
      fileDownloaded: "Arquivo de componente baixado com sucesso.",
    },
    features: {
      reactTitle: "Transforme Vetores em Código sem softwares pesados",
      reactDesc: "Gere componentes frontend limpos, modernos e acessíveis a partir dos seus arquivos SVG em milissegundos.",
      badgeTypeScriptReady: "Pronto para TypeScript & TSX",
      badgeFrameworkSupport: "React, Vue e Svelte",
      badgeLucideStyle: "Estilo Lucide & Heroicons",
    },
    steps: {
      react: [
        {
          title: "Envie ou Cole seu SVG",
          description: "Arraste seu arquivo .svg ou cole o código SVG diretamente.",
        },
        {
          title: "Escolha seu Framework",
          description: "Selecione React (TSX/JSX), Vue 3, Svelte ou Tailwind e personalize o nome.",
        },
        {
          title: "Copie ou Baixe",
          description: "Copie o código em 1 clique ou baixe o arquivo de componente pronto para produção.",
        },
      ],
    },
    FAQ: {
      react: [
        {
          question: "Como funciona o conversor de SVG para React?",
          answer: "O CrushSVG processa o SVG no navegador, converte atributos para camelCase e cria um componente React tipado.",
        },
        {
          question: "Posso usar no Next.js e Vite?",
          answer: "Sim! Os componentes são 100% compatíveis com Next.js, Vite, Remix e Astro.",
        },
        {
          question: "O que faz a opção 'currentColor'?",
          answer: "Substitui cores fixas por currentColor, permitindo que o ícone herde cores de classes Tailwind (ex: text-blue-500).",
        },
        {
          question: "Meus arquivos são salvos nos servidores?",
          answer: "Não, todo o processamento acontece localmente no seu navegador com total privacidade.",
        },
      ],
    },
  },
  ja: {
    navigation: {
      svgToReact: "SVG to React",
    },
    footer: {
      svgToReact: "SVG to React",
    },
    SEO: {
      svgToReactTitle: "SVGをReact JSX/TSX、Vue、Svelteコンポーネントに変換 | オンライン無料",
      svgToReactDescription: "無料のオンラインSVGコードジェネレーター。SVGベクターをReact（TSX/JSX）、Vue 3、Svelte、Tailwind、React Nativeコンポーネントに瞬時に変換します。",
    },
    tool_pages: {
      svgToReact: {
        h1: "SVGをReact コンポーネントに変換",
        subtitle: "SVGファイルをcurrentColor対応のTypeScriptおよびJavaScriptフロントエンドコンポーネントに即座に変換します。",
      },
    },
    svg_to_code_ui: {
      editorTitle: "SVGコンポーネントコンパイラ",
      liveCompilerBadge: "リアルタイムプレビュー",
      editorSubtitle: "SVGをアップロードまたは貼り付けて、React TSX、JSX、Vue 3、Svelte、Tailwind、React Nativeコードを生成します。",
      presetsLabel: "サンプル",
      svgOnlyNote: "最大10MBの.SVGベクターファイルをサポート",
      livePreview: "プレビュー",
      clearInput: "クリア",
      rawSvgLabel: "SVGソースコード",
      componentNameLabel: "コンポーネント名",
      useCurrentColor: "色をcurrentColorに置換",
      generatedCodeLabel: "生成されたコード",
      copied: "コピー完了！",
      copyCode: "コードをコピー",
      downloadFile: "ファイルをダウンロード",
      invalidSvgFile: "有効なSVGファイル（.svg）を選択してください",
      fileTooLarge: "ファイルサイズが10MBを超えています。",
      fileLoaded: "SVGが正常に読み込まれました。",
      fileReadError: "SVGファイルの読み込みに失敗しました。",
      codeCopied: "コンポーネントコードをクリップボードにコピーしました！",
      copyFailed: "コピーに失敗しました。",
      fileDownloaded: "コンポーネントファイルをダウンロードしました。",
    },
    features: {
      reactTitle: "ベクターを重いデザインソフトなしでプロダクションコードに変換",
      reactDesc: "SVGベクターからクリーンでアクセシブルなモダンフロントエンドコンポーネントを瞬時に生成します。",
      badgeTypeScriptReady: "TypeScript & TSX対応",
      badgeFrameworkSupport: "React, Vue & Svelte対応",
      badgeLucideStyle: "Lucide & Heroiconsスタイル",
    },
    steps: {
      react: [
        {
          title: "SVGをアップロードまたは貼り付け",
          description: ".svgファイルをドロップするか、SVGマークアップを直接貼り付けます。",
        },
        {
          title: "フレームワークを選択",
          description: "React (TSX/JSX)、Vue 3、Svelte、Tailwind、React Nativeを選択し、名前を設定します。",
        },
        {
          title: "コピーまたはダウンロード",
          description: "ワンクリックでコードをコピーするか、コンポーネントファイルを直接ダウンロードします。",
        },
      ],
    },
    FAQ: {
      react: [
        {
          question: "SVG to Reactコンバーターはどのように動作しますか？",
          answer: "CrushSVGはブラウザ上でSVGマークアップを直接解析し、属性をJSX形式に変換して型安全なReactコンポーネントを生成します。",
        },
        {
          question: "Next.jsやViteで使用できますか？",
          answer: "はい！生成されたコンポーネントはNext.js App Router、Vite、Astro、Remixと完全に互換性があります。",
        },
        {
          question: "「currentColor」オプションとは何ですか？",
          answer: "固定カラーをcurrentColorに置き換えることで、Tailwind CSSクラス（例: text-blue-500）からアイコンの色を柔軟に変更できるようになります。",
        },
        {
          question: "SVGデータはサーバーに送信されますか？",
          answer: "いいえ。すべての処理はお使いのブラウザ上で100%ローカルに実行され、安全に保護されます。",
        },
      ],
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

for (const loc of locales) {
  const filePath = path.resolve(`messages/${loc}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  deepMerge(data, newTranslations[loc]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Updated ${loc}.json`);
}
