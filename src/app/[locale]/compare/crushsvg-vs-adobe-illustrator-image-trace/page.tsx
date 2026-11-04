import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { constructLocalizedMetadata, SITE_URL } from "@/lib/seo";
import { Link, routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const copy = {
  en: {
    title: "CrushSVG vs Adobe Illustrator Image Trace",
    description: "Compare CrushSVG's browser-based PNG-to-SVG converter with Adobe Illustrator's Image Trace workflow.",
    eyebrow: "Tool comparison",
    intro: "CrushSVG and Adobe Illustrator can both help turn raster artwork into vector graphics. Compare their workflows, editing options, and access models to find the right fit.",
    matrix: "Feature comparison",
    feature: "Feature",
    crush: "CrushSVG",
    adobe: "Adobe Illustrator",
    task: "Main task",
    taskCrush: "Convert an uploaded raster image into an SVG in a browser.",
    taskAdobe: "Trace raster artwork as part of a full vector design and editing application.",
    workflow: "Tracing workflow",
    workflowCrush: "Upload an image, adjust the available vectorization settings, and download SVG output.",
    workflowAdobe: "Use Image Trace presets, then adjust tracing options in Illustrator.",
    platform: "Where it runs",
    platformCrush: "Browser-based online tool.",
    platformAdobe: "Illustrator is available for desktop, iPad, and web; Image Trace is an Illustrator feature.",
    access: "Access and pricing",
    accessCrush: "Free browser tools with conversion limits that depend on tool and account status.",
    accessAdobe: "Illustrator is a paid subscription, with plans and prices that vary by region.",
    verdictTitle: "Which one fits your workflow?",
    verdict: "Choose CrushSVG for a focused browser workflow that converts an image to SVG. Choose Illustrator when you need Image Trace inside a broader vector editing workflow with presets and additional design tools.",
    start: "Try PNG to SVG",
    sourceTitle: "Official Adobe references",
    sourceTrace: "Vectorize images using Image Trace",
    sourcePricing: "Illustrator plans and pricing",
    note: "This page compares documented workflows and product access. It does not compare conversion quality or speed; results depend on the image and settings. Adobe plan details can change.",
  },
  es: {
    title: "CrushSVG vs Adobe Illustrator Image Trace",
    description: "Compara el conversor de PNG a SVG en el navegador de CrushSVG con el flujo Image Trace de Adobe Illustrator.",
    eyebrow: "Comparación de herramientas",
    intro: "CrushSVG y Adobe Illustrator pueden ayudar a convertir imágenes rasterizadas en gráficos vectoriales. Compara sus flujos, opciones de edición y acceso para elegir.",
    matrix: "Comparación de funciones", feature: "Función", crush: "CrushSVG", adobe: "Adobe Illustrator",
    task: "Tarea principal", taskCrush: "Convertir una imagen rasterizada a SVG en el navegador.", taskAdobe: "Vectorizar imágenes rasterizadas dentro de una aplicación completa de diseño vectorial.",
    workflow: "Flujo de vectorización", workflowCrush: "Sube una imagen, ajusta las opciones disponibles y descarga el SVG.", workflowAdobe: "Usa ajustes preestablecidos de Image Trace y modifica las opciones en Illustrator.",
    platform: "Dónde funciona", platformCrush: "Herramienta en línea para el navegador.", platformAdobe: "Illustrator está disponible para escritorio, iPad y web; Image Trace es una función de Illustrator.",
    access: "Acceso y precio", accessCrush: "Herramientas gratuitas en el navegador; los límites dependen de la herramienta y la cuenta.", accessAdobe: "Illustrator requiere una suscripción de pago; los planes y precios varían según la región.",
    verdictTitle: "¿Cuál se adapta a tu flujo?", verdict: "Elige CrushSVG para convertir una imagen a SVG directamente en el navegador. Elige Illustrator si necesitas Image Trace dentro de un flujo más amplio de edición vectorial.",
    start: "Probar PNG a SVG", sourceTitle: "Fuentes oficiales de Adobe", sourceTrace: "Vectorizar imágenes con Image Trace", sourcePricing: "Planes y precios de Illustrator",
    note: "Esta página compara flujos documentados y acceso. No compara calidad ni velocidad; el resultado depende de la imagen y los ajustes. Los planes de Adobe pueden cambiar.",
  },
  de: {
    title: "CrushSVG vs. Adobe Illustrator Image Trace",
    description: "Vergleiche CrushSVGs browserbasierten PNG-zu-SVG-Konverter mit dem Image-Trace-Workflow in Adobe Illustrator.",
    eyebrow: "Tool-Vergleich",
    intro: "CrushSVG und Adobe Illustrator können Rastergrafiken in Vektorgrafiken umwandeln. Vergleiche Workflow, Bearbeitungsoptionen und Zugang.",
    matrix: "Funktionsvergleich", feature: "Funktion", crush: "CrushSVG", adobe: "Adobe Illustrator",
    task: "Hauptaufgabe", taskCrush: "Ein Rasterbild im Browser in SVG umwandeln.", taskAdobe: "Rastergrafiken mit einer umfassenden Anwendung für Vektordesign nachzeichnen.",
    workflow: "Vektorisierungs-Workflow", workflowCrush: "Bild hochladen, verfügbare Einstellungen anpassen und SVG herunterladen.", workflowAdobe: "Image-Trace-Vorgaben verwenden und die Optionen in Illustrator anpassen.",
    platform: "Plattform", platformCrush: "Online-Tool im Browser.", platformAdobe: "Illustrator ist für Desktop, iPad und Web verfügbar; Image Trace ist eine Illustrator-Funktion.",
    access: "Zugang und Preis", accessCrush: "Kostenlose Browser-Tools; Limits hängen vom Tool und Kontostatus ab.", accessAdobe: "Illustrator ist kostenpflichtig; Tarife und Preise variieren je nach Region.",
    verdictTitle: "Welcher Workflow passt?", verdict: "Wähle CrushSVG für die direkte Bild-zu-SVG-Konvertierung im Browser. Wähle Illustrator, wenn du Image Trace in einem umfassenderen Workflow zur Vektorbearbeitung benötigst.",
    start: "PNG zu SVG ausprobieren", sourceTitle: "Offizielle Adobe-Quellen", sourceTrace: "Bilder mit Image Trace vektorisieren", sourcePricing: "Illustrator-Tarife und Preise",
    note: "Diese Seite vergleicht dokumentierte Workflows und den Produktzugang, nicht Qualität oder Geschwindigkeit. Ergebnisse hängen vom Bild und den Einstellungen ab. Adobe-Tarife können sich ändern.",
  },
  fr: {
    title: "CrushSVG ou Adobe Illustrator Image Trace",
    description: "Comparez le convertisseur PNG vers SVG dans le navigateur de CrushSVG avec le workflow Image Trace d’Adobe Illustrator.",
    eyebrow: "Comparaison d’outils",
    intro: "CrushSVG et Adobe Illustrator peuvent convertir des images matricielles en graphiques vectoriels. Comparez leurs workflows, options d’édition et modes d’accès.",
    matrix: "Comparaison des fonctionnalités", feature: "Fonctionnalité", crush: "CrushSVG", adobe: "Adobe Illustrator",
    task: "Usage principal", taskCrush: "Convertir une image matricielle en SVG dans un navigateur.", taskAdobe: "Vectoriser une image dans une application complète de création et d’édition vectorielle.",
    workflow: "Workflow de vectorisation", workflowCrush: "Importer une image, régler les options disponibles et télécharger le SVG.", workflowAdobe: "Utiliser les paramètres prédéfinis Image Trace, puis ajuster les options dans Illustrator.",
    platform: "Plateforme", platformCrush: "Outil en ligne dans le navigateur.", platformAdobe: "Illustrator est disponible sur ordinateur, iPad et web ; Image Trace est une fonctionnalité d’Illustrator.",
    access: "Accès et prix", accessCrush: "Outils gratuits dans le navigateur ; les limites varient selon l’outil et le compte.", accessAdobe: "Illustrator nécessite un abonnement payant ; les offres et prix varient selon la région.",
    verdictTitle: "Quel workflow choisir ?", verdict: "Choisissez CrushSVG pour convertir directement une image en SVG dans le navigateur. Choisissez Illustrator si vous avez besoin d’Image Trace dans un workflow complet d’édition vectorielle.",
    start: "Essayer PNG vers SVG", sourceTitle: "Sources Adobe officielles", sourceTrace: "Vectoriser des images avec Image Trace", sourcePricing: "Offres et tarifs Illustrator",
    note: "Cette page compare les workflows documentés et l’accès aux produits, sans comparer la qualité ni la vitesse. Le résultat dépend de l’image et des réglages. Les offres Adobe peuvent changer.",
  },
  pt: {
    title: "CrushSVG vs Adobe Illustrator Image Trace",
    description: "Compare o conversor de PNG para SVG no navegador do CrushSVG com o fluxo Image Trace do Adobe Illustrator.",
    eyebrow: "Comparação de ferramentas",
    intro: "CrushSVG e Adobe Illustrator podem ajudar a transformar imagens rasterizadas em gráficos vetoriais. Compare os fluxos, as opções de edição e o acesso.",
    matrix: "Comparação de recursos", feature: "Recurso", crush: "CrushSVG", adobe: "Adobe Illustrator",
    task: "Tarefa principal", taskCrush: "Converter uma imagem rasterizada em SVG no navegador.", taskAdobe: "Traçar imagens rasterizadas em um aplicativo completo de design e edição vetorial.",
    workflow: "Fluxo de vetorização", workflowCrush: "Envie uma imagem, ajuste as opções disponíveis e baixe o SVG.", workflowAdobe: "Use predefinições do Image Trace e ajuste as opções no Illustrator.",
    platform: "Plataforma", platformCrush: "Ferramenta online no navegador.", platformAdobe: "O Illustrator está disponível para desktop, iPad e web; Image Trace é um recurso do Illustrator.",
    access: "Acesso e preço", accessCrush: "Ferramentas gratuitas no navegador; os limites variam conforme a ferramenta e a conta.", accessAdobe: "O Illustrator exige uma assinatura paga; planos e preços variam por região.",
    verdictTitle: "Qual fluxo atende melhor?", verdict: "Escolha o CrushSVG para converter uma imagem em SVG diretamente no navegador. Escolha o Illustrator se precisar usar Image Trace em um fluxo mais amplo de edição vetorial.",
    start: "Testar PNG para SVG", sourceTitle: "Referências oficiais da Adobe", sourceTrace: "Vetorização de imagens com Image Trace", sourcePricing: "Planos e preços do Illustrator",
    note: "Esta página compara fluxos documentados e acesso aos produtos, sem comparar qualidade ou velocidade. O resultado depende da imagem e das configurações. Os planos da Adobe podem mudar.",
  },
  ja: {
    title: "CrushSVG と Adobe Illustrator Image Trace の比較",
    description: "ブラウザーで使えるCrushSVGのPNGからSVGへの変換と、Adobe IllustratorのImage Traceを比較します。",
    eyebrow: "ツール比較",
    intro: "CrushSVGとAdobe Illustratorは、ラスター画像をベクター画像に変換できます。ワークフロー、編集機能、利用方法を比較して選びましょう。",
    matrix: "機能の比較", feature: "項目", crush: "CrushSVG", adobe: "Adobe Illustrator",
    task: "主な用途", taskCrush: "ブラウザーでラスター画像をSVGに変換します。", taskAdobe: "ベクターデザインと編集アプリ内でラスター画像をトレースします。",
    workflow: "ベクター化の手順", workflowCrush: "画像をアップロードし、設定を調整してSVGをダウンロードします。", workflowAdobe: "Image Traceのプリセットを使い、Illustratorで設定を調整します。",
    platform: "利用環境", platformCrush: "ブラウザーで使うオンラインツールです。", platformAdobe: "Illustratorはデスクトップ、iPad、Webで利用できます。Image TraceはIllustratorの機能です。",
    access: "利用方法と料金", accessCrush: "無料のブラウザーツールです。利用上限はツールやアカウントによって異なります。", accessAdobe: "Illustratorは有料サブスクリプションです。プランと価格は地域によって異なります。",
    verdictTitle: "どちらが適していますか？", verdict: "ブラウザーで画像をSVGに変換するならCrushSVGをお選びください。ベクター編集全般の中でImage Traceを使うならIllustratorが適しています。",
    start: "PNGからSVGを試す", sourceTitle: "Adobe公式情報", sourceTrace: "Image Traceで画像をベクター化", sourcePricing: "Illustratorのプランと価格",
    note: "このページでは公開されているワークフローと利用方法を比較しています。品質や速度は比較していません。結果は画像と設定によって異なります。Adobeのプランは変更される場合があります。",
  },
} satisfies Record<Locale, Record<string, string>>;

const rows = [
  ["task", "taskCrush", "taskAdobe"],
  ["workflow", "workflowCrush", "workflowAdobe"],
  ["platform", "platformCrush", "platformAdobe"],
  ["access", "accessCrush", "accessAdobe"],
] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const content = copy[locale as Locale] ?? copy.en;
  return constructLocalizedMetadata({
    locale,
    routeKey: "/compare/crushsvg-vs-adobe-illustrator-image-trace",
    title: `${content.title} | CrushSVG`,
    description: content.description,
    keywords: ["CrushSVG vs Adobe Illustrator", "Adobe Illustrator Image Trace alternative", "PNG to SVG converter"],
  });
}

export default async function AdobeComparisonPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = copy[locale as Locale] ?? copy.en;
  const canonicalPath = locale === "en"
    ? "/compare/crushsvg-vs-adobe-illustrator-image-trace"
    : `/${locale}${routing.pathnames["/compare/crushsvg-vs-adobe-illustrator-image-trace"][locale as Locale]}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.description,
    url: `${SITE_URL}${canonicalPath}`,
    about: [
      { "@type": "SoftwareApplication", name: "CrushSVG", url: SITE_URL },
      { "@type": "SoftwareApplication", name: "Adobe Illustrator", url: "https://www.adobe.com/products/illustrator.html" },
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
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead><tr className="bg-[#FCF7F4] text-sm text-text-dark">
              <th scope="col" className="w-[24%] px-5 py-4 font-semibold md:px-8">{content.feature}</th>
              <th scope="col" className="w-[38%] px-5 py-4 font-semibold md:px-8">{content.crush}</th>
              <th scope="col" className="w-[38%] px-5 py-4 font-semibold md:px-8">{content.adobe}</th>
            </tr></thead>
            <tbody>{rows.map(([label, crush, adobe]) => (
              <tr key={label} className="border-t border-[#F2EDE8] align-top">
                <th scope="row" className="px-5 py-5 text-sm font-semibold text-text-dark md:px-8">{content[label]}</th>
                <td className="px-5 py-5 text-sm leading-6 text-text-muted md:px-8">{content[crush]}</td>
                <td className="px-5 py-5 text-sm leading-6 text-text-muted md:px-8">{content[adobe]}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[#F2EDE8] bg-white p-6 md:p-8">
          <h2 className="font-heading text-xl font-semibold text-text-dark">{content.verdictTitle}</h2>
          <p className="mt-3 text-base leading-7 text-text-muted">{content.verdict}</p>
          <Link href="/png-to-svg" className="mt-6 inline-flex rounded-lg bg-brand-primary px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90">{content.start}</Link>
        </article>
        <aside className="rounded-2xl border border-[#F2EDE8] bg-[#FCF7F4] p-6 md:p-8">
          <h2 className="font-heading text-xl font-semibold text-text-dark">{content.sourceTitle}</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-text-muted">
            <li><a className="text-brand-primary underline underline-offset-2" href="https://helpx.adobe.com/illustrator/desktop/manage-objects/traces-mockups-symbols/trace-images-to-convert-raster-into-vector-artwork.html" target="_blank" rel="noopener noreferrer">{content.sourceTrace}</a></li>
            <li><a className="text-brand-primary underline underline-offset-2" href="https://www.adobe.com/products/illustrator/plans.html" target="_blank" rel="noopener noreferrer">{content.sourcePricing}</a></li>
          </ul>
        </aside>
      </section>

      <p className="mt-8 text-sm leading-6 text-text-muted">{content.note}</p>
    </main>
  );
}
