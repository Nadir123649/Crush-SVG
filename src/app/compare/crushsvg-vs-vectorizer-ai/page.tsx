import type { Metadata } from "next";
import { constructMetadata, SITE_URL } from "@/lib/seo";
import { Link, routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const copy = {
  en: {
    title: "CrushSVG vs Vectorizer.AI: Which tool fits your workflow?",
    description: "Compare CrushSVG and Vectorizer.AI by conversion workflow, supported formats, tools, and access model to choose the right image tool.",
    eyebrow: "Tool comparison",
    intro: "Both tools can turn raster artwork into vector output. The best fit depends on whether you need a focused vectorizer or a wider set of everyday SVG and image utilities.",
    matrix: "Feature comparison",
    crush: "CrushSVG",
    vectorizer: "Vectorizer.AI",
    feature: "Feature",
    raster: "Raster image to vector",
    rasterCrush: "PNG to SVG conversion",
    rasterVectorizer: "Image vectorization with an interactive preview",
    inputs: "Raster inputs",
    inputsCrush: "PNG and other supported image uploads in the converter",
    inputsVectorizer: "PNG, JPG, GIF, BMP, and WebP",
    outputs: "Vector outputs",
    outputsCrush: "SVG",
    outputsVectorizer: "SVG, EPS, DXF, and PDF",
    utilities: "Additional image tools",
    utilitiesCrush: "SVG to PNG, SVG optimizer, image resizer, background remover, favicon generator, and SVG to React",
    utilitiesVectorizer: "Focused on bitmap vectorization and its output options",
    access: "Access model",
    accessCrush: "Free tools; limits and account requirements vary by tool",
    accessVectorizer: "Preview in the web app; subscription required for production downloads. API uses credits.",
    automation: "Programmatic API",
    automationCrush: "Public API includes SVG-to-PNG, raster-to-SVG, and background-removal endpoints",
    automationVectorizer: "Image-vectorization API with usage-based plans",
    verdictTitle: "Which should you choose?",
    verdict: "Choose CrushSVG when you need a collection of SVG and image utilities in one place, including SVG-to-PNG, optimization, resizing, background removal, and favicon creation. Choose Vectorizer.AI when your main task is tracing bitmap artwork into editable vector formats and you want to review a preview and adjust vector output options.",
    start: "Try CrushSVG tools",
    source: "Comparison based on publicly available product documentation reviewed October 2026. Features and plans can change; check each provider for current details.",
    sourceTitle: "Official Vectorizer.AI details",
    sourceConverter: "Image-to-vector converter",
    sourcePricing: "Plans and pricing",
    sourceApi: "API documentation",
    noteTitle: "About this comparison",
    note: "The products serve overlapping but different workflows. This page compares listed capabilities, not conversion quality or speed; results depend on the source artwork and settings.",
  },
  es: {
    title: "CrushSVG vs Vectorizer.AI: ¿qué herramienta encaja con tu flujo de trabajo?",
    description: "Compara CrushSVG y Vectorizer.AI por flujo de conversión, formatos, herramientas y modelo de acceso.",
    eyebrow: "Comparación de herramientas",
    intro: "Ambas herramientas pueden convertir imágenes rasterizadas en vectores. La mejor opción depende de si necesitas un vectorizador especializado o más utilidades de SVG e imagen.",
    matrix: "Comparación de funciones", crush: "CrushSVG", vectorizer: "Vectorizer.AI", feature: "Función",
    raster: "Imagen rasterizada a vector", rasterCrush: "Conversión de PNG a SVG", rasterVectorizer: "Vectorización con vista previa interactiva",
    inputs: "Entradas rasterizadas", inputsCrush: "PNG y otras imágenes compatibles", inputsVectorizer: "PNG, JPG, GIF, BMP y WebP",
    outputs: "Salidas vectoriales", outputsCrush: "SVG", outputsVectorizer: "SVG, EPS, DXF y PDF",
    utilities: "Otras herramientas de imagen", utilitiesCrush: "SVG a PNG, optimizador SVG, redimensionador, eliminador de fondos, favicon y SVG a React", utilitiesVectorizer: "Especializado en vectorización de mapas de bits y opciones de salida",
    access: "Modelo de acceso", accessCrush: "Herramientas gratuitas; los límites y requisitos de cuenta varían", accessVectorizer: "Vista previa web; se requiere suscripción para descargas finales. La API usa créditos.",
    automation: "API programática", automationCrush: "API pública con endpoints de SVG a PNG, raster a SVG y eliminación de fondos", automationVectorizer: "API de vectorización con planes por uso",
    verdictTitle: "¿Cuál deberías elegir?", verdict: "Elige CrushSVG si necesitas varias utilidades de SVG e imagen en un mismo lugar. Elige Vectorizer.AI si tu tarea principal es convertir imágenes de mapa de bits en formatos vectoriales editables y revisar una vista previa.",
    start: "Probar CrushSVG", source: "Comparación basada en documentación pública revisada en octubre de 2026. Las funciones y los planes pueden cambiar; consulta cada proveedor.",
    sourceTitle: "Información oficial de Vectorizer.AI", sourceConverter: "Conversor de imagen a vector", sourcePricing: "Planes y precios", sourceApi: "Documentación de API",
    noteTitle: "Sobre esta comparación", note: "Los productos cubren flujos de trabajo parcialmente distintos. Se comparan funciones publicadas, no la calidad ni la velocidad; los resultados dependen de la imagen y los ajustes.",
  },
  de: {
    title: "CrushSVG vs. Vectorizer.AI: Welches Tool passt zu deinem Workflow?",
    description: "Vergleiche CrushSVG und Vectorizer.AI nach Workflow, Formaten, Tools und Zugangsmodell.",
    eyebrow: "Tool-Vergleich", intro: "Beide Tools können Rastergrafiken in Vektoren umwandeln. Die passende Wahl hängt davon ab, ob du einen spezialisierten Vektorisierer oder mehrere SVG- und Bildwerkzeuge benötigst.",
    matrix: "Funktionsvergleich", crush: "CrushSVG", vectorizer: "Vectorizer.AI", feature: "Funktion",
    raster: "Rasterbild zu Vektor", rasterCrush: "PNG-zu-SVG-Konvertierung", rasterVectorizer: "Bildvektorisierung mit interaktiver Vorschau",
    inputs: "Raster-Eingabeformate", inputsCrush: "PNG und weitere unterstützte Bild-Uploads", inputsVectorizer: "PNG, JPG, GIF, BMP und WebP",
    outputs: "Vektor-Ausgabeformate", outputsCrush: "SVG", outputsVectorizer: "SVG, EPS, DXF und PDF",
    utilities: "Weitere Bildwerkzeuge", utilitiesCrush: "SVG zu PNG, SVG-Optimierer, Bildgrößenänderung, Hintergrundentferner, Favicon-Generator und SVG zu React", utilitiesVectorizer: "Fokus auf Bitmap-Vektorisierung und Ausgabeoptionen",
    access: "Zugangsmodell", accessCrush: "Kostenlose Tools; Limits und Kontoanforderungen unterscheiden sich je nach Tool", accessVectorizer: "Vorschau in der Web-App; Abo für Produktionsdownloads. Die API nutzt Credits.",
    automation: "Programmierbare API", automationCrush: "Öffentliche API mit Endpunkten für SVG zu PNG, Raster zu SVG und Hintergrundentfernung", automationVectorizer: "API zur Bildvektorisierung mit nutzungsbasierten Tarifen",
    verdictTitle: "Welches Tool solltest du wählen?", verdict: "Wähle CrushSVG, wenn du mehrere SVG- und Bildwerkzeuge an einem Ort brauchst. Wähle Vectorizer.AI, wenn du vor allem Bitmap-Grafiken in bearbeitbare Vektorformate umwandeln und eine Vorschau prüfen möchtest.",
    start: "CrushSVG-Tools ausprobieren", source: "Vergleich anhand öffentlich zugänglicher Produktdokumentation, geprüft im Oktober 2026. Funktionen und Tarife können sich ändern.",
    sourceTitle: "Offizielle Informationen zu Vectorizer.AI", sourceConverter: "Bild-zu-Vektor-Konverter", sourcePricing: "Tarife und Preise", sourceApi: "API-Dokumentation",
    noteTitle: "Über diesen Vergleich", note: "Die Produkte unterstützen teilweise unterschiedliche Workflows. Verglichen werden aufgeführte Funktionen, nicht Qualität oder Geschwindigkeit. Ergebnisse hängen vom Bild und den Einstellungen ab.",
  },
  fr: {
    title: "CrushSVG vs Vectorizer.AI : quel outil choisir pour votre flux de travail ?",
    description: "Comparez CrushSVG et Vectorizer.AI selon leurs flux de conversion, formats, outils et modèles d’accès.",
    eyebrow: "Comparatif d’outils", intro: "Les deux outils peuvent convertir des images matricielles en vecteurs. Le meilleur choix dépend de votre besoin : un vectoriseur spécialisé ou une gamme d’outils SVG et image.",
    matrix: "Comparaison des fonctionnalités", crush: "CrushSVG", vectorizer: "Vectorizer.AI", feature: "Fonctionnalité",
    raster: "Image matricielle vers vecteur", rasterCrush: "Conversion PNG vers SVG", rasterVectorizer: "Vectorisation avec aperçu interactif",
    inputs: "Formats matriciels d’entrée", inputsCrush: "PNG et autres images prises en charge", inputsVectorizer: "PNG, JPG, GIF, BMP et WebP",
    outputs: "Formats vectoriels de sortie", outputsCrush: "SVG", outputsVectorizer: "SVG, EPS, DXF et PDF",
    utilities: "Autres outils d’image", utilitiesCrush: "SVG vers PNG, optimisation SVG, redimensionnement, suppression d’arrière-plan, favicon et SVG vers React", utilitiesVectorizer: "Spécialisé dans la vectorisation bitmap et ses options de sortie",
    access: "Modèle d’accès", accessCrush: "Outils gratuits ; limites et création de compte variables selon l’outil", accessVectorizer: "Aperçu web ; abonnement requis pour les téléchargements finaux. L’API utilise des crédits.",
    automation: "API programmable", automationCrush: "API publique avec endpoints SVG vers PNG, raster vers SVG et suppression d’arrière-plan", automationVectorizer: "API de vectorisation avec forfaits à l’usage",
    verdictTitle: "Lequel choisir ?", verdict: "Choisissez CrushSVG pour réunir plusieurs outils SVG et image au même endroit. Choisissez Vectorizer.AI si votre tâche principale consiste à vectoriser des images bitmap en formats éditables et à examiner un aperçu.",
    start: "Essayer les outils CrushSVG", source: "Comparaison fondée sur la documentation publique consultée en octobre 2026. Les fonctionnalités et offres peuvent évoluer.",
    sourceTitle: "Informations officielles de Vectorizer.AI", sourceConverter: "Convertisseur image vers vecteur", sourcePricing: "Offres et tarifs", sourceApi: "Documentation de l’API",
    noteTitle: "À propos de ce comparatif", note: "Les produits répondent à des besoins qui se recoupent sans être identiques. Cette page compare les fonctionnalités annoncées, pas la qualité ni la vitesse des résultats.",
  },
  pt: {
    title: "CrushSVG vs Vectorizer.AI: qual ferramenta combina com seu fluxo de trabalho?",
    description: "Compare CrushSVG e Vectorizer.AI por fluxo de conversão, formatos, ferramentas e modelo de acesso.",
    eyebrow: "Comparação de ferramentas", intro: "As duas ferramentas convertem imagens rasterizadas em vetores. A escolha depende de você precisar de um vetorizar especializado ou de várias ferramentas para SVG e imagens.",
    matrix: "Comparação de recursos", crush: "CrushSVG", vectorizer: "Vectorizer.AI", feature: "Recurso",
    raster: "Imagem raster para vetor", rasterCrush: "Conversão de PNG para SVG", rasterVectorizer: "Vetorização de imagens com prévia interativa",
    inputs: "Entradas rasterizadas", inputsCrush: "PNG e outros formatos de imagem compatíveis", inputsVectorizer: "PNG, JPG, GIF, BMP e WebP",
    outputs: "Saídas vetoriais", outputsCrush: "SVG", outputsVectorizer: "SVG, EPS, DXF e PDF",
    utilities: "Outras ferramentas de imagem", utilitiesCrush: "SVG para PNG, otimizador SVG, redimensionador, removedor de fundo, favicon e SVG para React", utilitiesVectorizer: "Foco em vetorização de bitmap e opções de saída",
    access: "Modelo de acesso", accessCrush: "Ferramentas gratuitas; limites e requisitos de conta variam", accessVectorizer: "Prévia no app web; assinatura para downloads finais. A API usa créditos.",
    automation: "API programável", automationCrush: "API pública com endpoints de SVG para PNG, raster para SVG e remoção de fundo", automationVectorizer: "API de vetorização com planos por uso",
    verdictTitle: "Qual escolher?", verdict: "Escolha CrushSVG para usar várias ferramentas de SVG e imagem em um só lugar. Escolha Vectorizer.AI se sua tarefa principal for vetorizar imagens bitmap em formatos editáveis e revisar uma prévia.",
    start: "Experimentar ferramentas CrushSVG", source: "Comparação baseada em documentação pública consultada em outubro de 2026. Recursos e planos podem mudar.",
    sourceTitle: "Informações oficiais do Vectorizer.AI", sourceConverter: "Conversor de imagem para vetor", sourcePricing: "Planos e preços", sourceApi: "Documentação da API",
    noteTitle: "Sobre esta comparação", note: "Os produtos atendem a fluxos parcialmente diferentes. Comparamos recursos publicados, não qualidade ou velocidade; os resultados dependem da imagem e das configurações.",
  },
  ja: {
    title: "CrushSVG と Vectorizer.AI の比較：用途に合うツールは？",
    description: "変換ワークフロー、対応形式、ツール、利用モデルから CrushSVG と Vectorizer.AI を比較します。",
    eyebrow: "ツール比較", intro: "どちらもラスター画像をベクターに変換できます。専用のベクター化ツールが必要か、SVG と画像の幅広いユーティリティが必要かで選択できます。",
    matrix: "機能比較", crush: "CrushSVG", vectorizer: "Vectorizer.AI", feature: "機能",
    raster: "ラスター画像からベクターへ", rasterCrush: "PNG から SVG への変換", rasterVectorizer: "インタラクティブなプレビュー付き画像ベクター化",
    inputs: "ラスター入力形式", inputsCrush: "PNG および対応する画像アップロード", inputsVectorizer: "PNG、JPG、GIF、BMP、WebP",
    outputs: "ベクター出力形式", outputsCrush: "SVG", outputsVectorizer: "SVG、EPS、DXF、PDF",
    utilities: "その他の画像ツール", utilitiesCrush: "SVG から PNG、SVG 最適化、画像リサイズ、背景削除、ファビコン生成、SVG から React", utilitiesVectorizer: "ビットマップのベクター化と出力オプションに特化",
    access: "利用モデル", accessCrush: "無料ツール。制限とアカウント要件はツールにより異なります", accessVectorizer: "Web アプリでプレビュー可能。製品版のダウンロードには契約が必要です。API はクレジット制です。",
    automation: "プログラム用 API", automationCrush: "SVG から PNG、ラスターから SVG、背景削除のエンドポイントを持つ公開 API", automationVectorizer: "従量制プランの画像ベクター化 API",
    verdictTitle: "どちらを選ぶべき？", verdict: "複数の SVG・画像ツールをまとめて使いたい場合は CrushSVG を選んでください。ビットマップ画像を編集可能なベクター形式に変換し、プレビューを確認したい場合は Vectorizer.AI が適しています。",
    start: "CrushSVG のツールを試す", source: "2026年10月に確認した公開製品ドキュメントに基づく比較です。機能やプランは変更される場合があります。",
    sourceTitle: "Vectorizer.AI 公式情報", sourceConverter: "画像からベクターへの変換", sourcePricing: "プランと料金", sourceApi: "API ドキュメント",
    noteTitle: "比較について", note: "両製品は一部異なるワークフローに対応しています。公開されている機能を比較しており、品質や速度は比較していません。結果は元画像と設定により異なります。",
  },
} satisfies Record<Locale, Record<string, string>>;

const rows = [
  ["raster", "rasterCrush", "rasterVectorizer"],
  ["inputs", "inputsCrush", "inputsVectorizer"],
  ["outputs", "outputsCrush", "outputsVectorizer"],
  ["utilities", "utilitiesCrush", "utilitiesVectorizer"],
  ["access", "accessCrush", "accessVectorizer"],
  ["automation", "automationCrush", "automationVectorizer"],
] as const;

export function generateMetadata(): Metadata {
  const content = copy.en;
  return constructMetadata({
    title: `${content.title} | CrushSVG`,
    description: content.description,
    canonicalPath: "/compare/crushsvg-vs-vectorizer-ai",
    keywords: ["CrushSVG vs Vectorizer.AI", "Vectorizer.AI alternative", "image to SVG converter", "SVG tools comparison"],
  });
}

export default function ComparisonPage() {
  const content = copy.en;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.description,
    url: `${SITE_URL}/compare/crushsvg-vs-vectorizer-ai`,
    isPartOf: { "@type": "WebSite", name: "CrushSVG", url: SITE_URL },
    about: [
      { "@type": "SoftwareApplication", name: "CrushSVG", url: SITE_URL },
      { "@type": "SoftwareApplication", name: "Vectorizer.AI", url: "https://vectorizer.ai/" },
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col px-5 py-12 md:px-8 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="mx-auto mb-12 max-w-[800px] text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-primary">{content.eyebrow}</p>
        <h1 className="font-heading text-3xl font-bold leading-tight text-text-dark md:text-5xl">{content.title}</h1>
        <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-text-muted md:text-lg">{content.intro}</p>
      </header>

      <section aria-labelledby="feature-comparison" className="overflow-hidden rounded-2xl border border-[#F2EDE8] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        <h2 id="feature-comparison" className="border-b border-[#F2EDE8] px-5 py-5 font-heading text-2xl font-semibold text-text-dark md:px-8">{content.matrix}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-[#FCF7F4] text-sm text-text-dark">
                <th scope="col" className="w-[24%] px-5 py-4 font-semibold md:px-8">{content.feature}</th>
                <th scope="col" className="w-[38%] px-5 py-4 font-semibold md:px-8">{content.crush}</th>
                <th scope="col" className="w-[38%] px-5 py-4 font-semibold md:px-8">{content.vectorizer}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, crush, vectorizer]) => (
                <tr key={label} className="border-t border-[#F2EDE8] align-top">
                  <th scope="row" className="px-5 py-5 text-sm font-semibold text-text-dark md:px-8">{content[label]}</th>
                  <td className="px-5 py-5 text-sm leading-6 text-text-muted md:px-8">{content[crush]}</td>
                  <td className="px-5 py-5 text-sm leading-6 text-text-muted md:px-8">{content[vectorizer]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[#F2EDE8] bg-white p-6 md:p-8">
          <h2 className="font-heading text-xl font-semibold text-text-dark">{content.verdictTitle}</h2>
          <p className="mt-3 text-base leading-7 text-text-muted">{content.verdict}</p>
          <Link href="/" className="mt-6 inline-flex rounded-lg bg-brand-primary px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90">{content.start}</Link>
        </article>
        <aside className="rounded-2xl border border-[#F2EDE8] bg-[#FCF7F4] p-6 md:p-8">
          <h2 className="font-heading text-xl font-semibold text-text-dark">{content.sourceTitle}</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-text-muted">
            <li><a className="text-brand-primary underline underline-offset-2" href="https://vectorizer.ai/image-to-vector-converter" target="_blank" rel="noopener noreferrer">{content.sourceConverter}</a></li>
            <li><a className="text-brand-primary underline underline-offset-2" href="https://vectorizer.ai/pricing" target="_blank" rel="noopener noreferrer">{content.sourcePricing}</a></li>
            <li><a className="text-brand-primary underline underline-offset-2" href="https://vectorizer.ai/api/documentation" target="_blank" rel="noopener noreferrer">{content.sourceApi}</a></li>
          </ul>
        </aside>
      </section>

      <p className="mt-8 text-sm leading-6 text-text-muted">{content.noteTitle}: {content.note} {content.source}</p>
    </main>
  );
}
