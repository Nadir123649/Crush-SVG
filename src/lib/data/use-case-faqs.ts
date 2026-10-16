export interface UseCaseFAQ {
  question: string;
  answer: string;
}

const useCaseFaqs: Record<string, UseCaseFAQ[]> = {
  "svg-to-png-for-react": [
    {
      question: "Why convert an SVG to PNG for a React app?",
      answer: "PNG is useful when a component, image service, or social platform needs a raster asset instead of vector markup. It also gives you a predictable fallback image for previews and older integrations.",
    },
    {
      question: "Will the converted PNG keep a transparent background?",
      answer: "Yes. SVG areas without a painted background remain transparent in the PNG, so the image can sit on different React page backgrounds.",
    },
    {
      question: "What size should I export for a React image?",
      answer: "Choose pixel dimensions at least as large as the biggest size at which the image will appear. For high-density displays, exporting around twice the rendered dimensions helps keep edges sharp.",
    },
  ],
  "svg-to-png-for-email-signatures": [
    {
      question: "Why use PNG instead of SVG in an email signature?",
      answer: "Some email clients restrict or inconsistently display SVG images. A PNG logo is a broadly compatible raster alternative for an HTML email signature.",
    },
    {
      question: "Can an email-signature PNG have a transparent background?",
      answer: "Yes. If the source SVG has no background shape, the exported PNG can keep its transparent areas so the logo works with light or colored signature layouts.",
    },
    {
      question: "How do I keep a signature logo sharp on high-density screens?",
      answer: "Export the PNG at roughly twice its intended display width and height, then set the displayed dimensions in the signature. Avoid enlarging a small PNG after export.",
    },
  ],
  "svg-to-png-transparent-background": [
    {
      question: "Does converting SVG to PNG preserve transparency?",
      answer: "Yes. Unpainted parts of the SVG are transparent in the PNG. If the SVG contains a full-page rectangle or background color, that shape will be included in the export.",
    },
    {
      question: "Why does my exported PNG have a white background?",
      answer: "The SVG may contain a white background rectangle, or the app displaying the image may show transparency against white. Check the SVG for a background shape and view the PNG over a colored background.",
    },
    {
      question: "Can I use a transparent PNG over any color?",
      answer: "Yes. Transparent pixels reveal the page or design underneath, while the visible SVG artwork keeps its own colors and opacity.",
    },
  ],
  "high-resolution-svg-to-png": [
    {
      question: "How do I export a high-resolution PNG from an SVG?",
      answer: "Set the output width and height to the pixel dimensions you need. Because SVG is vector-based, it can be rendered at larger dimensions without the source pixelation associated with enlarging a small raster image.",
    },
    {
      question: "What is the maximum output size?",
      answer: "CrushSVG supports output scaling up to 16 times, with each side capped at 4,000 pixels. The practical maximum depends on the source dimensions and the converter's output limit.",
    },
    {
      question: "Does a larger PNG always look sharper?",
      answer: "A larger export helps when the image will be displayed or printed larger, but it cannot restore detail missing from the SVG source. Use dimensions suited to the final display size to avoid unnecessary file weight.",
    },
  ],
  "svg-to-png-for-cricut": [
    {
      question: "Should I use SVG or PNG for Cricut Design Space?",
      answer: "SVG is generally preferable for cut paths because it stays vector-based. PNG can be useful for print-then-cut artwork or when a workflow requires a raster image.",
    },
    {
      question: "Will the PNG keep a transparent background for print then cut?",
      answer: "Yes, transparent areas in the SVG can remain transparent in the PNG. Confirm the artwork has no background rectangle before exporting.",
    },
    {
      question: "How can I avoid jagged edges on a Cricut PNG?",
      answer: "Export at or above the final print dimensions and avoid scaling the PNG up afterward. For cut paths that need clean edges at any size, use the original SVG when the Cricut workflow supports it.",
    },
  ],
  "svg-to-png-for-canva": [
    {
      question: "Why upload a PNG to Canva instead of an SVG?",
      answer: "PNG is a convenient choice when you want artwork to display consistently as a placed image. SVG may be preferable when you need editable vector elements and your Canva plan and workflow support SVG uploads.",
    },
    {
      question: "Will Canva keep the transparent background?",
      answer: "Canva can place transparent PNGs over other colors and images. Make sure the source SVG does not include a background shape before converting.",
    },
    {
      question: "What PNG dimensions should I use for Canva designs?",
      answer: "Export at the intended Canva placement size or larger, especially for print and high-density screens. Avoid enlarging a small raster export inside the design.",
    },
  ],
  "svg-to-png-for-word-powerpoint": [
    {
      question: "Why convert an SVG to PNG for Word or PowerPoint?",
      answer: "PNG can be a practical compatibility option when a document viewer, workflow, or recipient does not handle SVG consistently. SVG remains useful when you need scalable, editable vector artwork.",
    },
    {
      question: "Can I keep a transparent logo background in PowerPoint?",
      answer: "Yes. A PNG exported from an SVG without a background shape can keep transparency when inserted into a slide or document.",
    },
    {
      question: "How do I prevent a logo from looking blurry in a presentation?",
      answer: "Export the PNG at the size it will appear on the slide, or larger for high-density displays. Avoid stretching a low-resolution image beyond its exported dimensions.",
    },
  ],
  "figma-svg-to-high-res-png": [
    {
      question: "How do I convert an SVG exported from Figma to PNG?",
      answer: "Export the design or asset as SVG from Figma, then use the SVG code or file as the source for PNG conversion. Set the output dimensions to match the intended use.",
    },
    {
      question: "Will gradients and transparency from Figma be preserved?",
      answer: "Common SVG fills, gradients, and alpha transparency are retained when represented in the exported SVG. Check effects that depend on external fonts or unsupported SVG features in the preview.",
    },
    {
      question: "What does 2x or 4x PNG export mean?",
      answer: "A 2x export doubles the pixel width and height of the source dimensions; a 4x export quadruples them. CrushSVG allows scaling up to 16x, subject to the 4,000-pixel per-side output cap.",
    },
  ],
  "svg-to-png-for-print-300-dpi": [
    {
      question: "How many pixels do I need for a 300 DPI print?",
      answer: "Multiply the print width and height in inches by 300. For example, a 4-by-6-inch print needs 1,200 by 1,800 pixels at 300 pixels per inch.",
    },
    {
      question: "Does setting 300 DPI make any PNG print-ready?",
      answer: "No. The pixel dimensions determine how much detail is available at the print size. A small image labeled 300 DPI can still look soft when enlarged; export enough pixels for the intended dimensions.",
    },
    {
      question: "Can I enlarge an SVG for a poster without pixelating it?",
      answer: "SVG artwork can be rendered at poster-sized pixel dimensions without source raster pixels becoming enlarged. The final output is still capped at 4,000 pixels per side in this converter.",
    },
  ],
  "svg-to-ico-favicon-pack": [
    {
      question: "What is included in an SVG favicon pack?",
      answer: "A favicon pack can include ICO files for common browser icon sizes plus platform icons and a web manifest. Check the generated files against the setup instructions for your website.",
    },
    {
      question: "Why should a favicon include multiple sizes?",
      answer: "Browsers and devices request icons at different dimensions and in different formats. Providing suitable sizes helps avoid relying on one small image being scaled everywhere.",
    },
    {
      question: "What should I check before converting an SVG logo to a favicon?",
      answer: "Use a square, legible mark with simple details. Fine text and thin strokes can disappear at 16-by-16 pixels, so preview the smallest icon size before publishing it.",
    },
  ],
  "svg-to-webp-converter": [
    {
      question: "Why convert SVG artwork to WebP?",
      answer: "WebP is a raster format supported by modern browsers and can be useful when a site needs a raster image with alpha transparency. Keep the SVG when scalable vector rendering is more useful.",
    },
    {
      question: "Does WebP support transparent backgrounds?",
      answer: "Yes. WebP supports alpha transparency, so transparent areas in an SVG can be retained in the converted image when the source has no background shape.",
    },
    {
      question: "Will WebP always be smaller than PNG?",
      answer: "Not in every case. File size depends on image content, dimensions, and encoding settings. Compare the exported files for your artwork and quality requirements.",
    },
  ],
  "convert-illustrator-svg-to-png": [
    {
      question: "How do I convert an Adobe Illustrator SVG to PNG?",
      answer: "Export the artwork from Illustrator as an SVG, then upload the file or paste its SVG code into the converter. Choose output dimensions that suit the final display or print size.",
    },
    {
      question: "Why do Illustrator fonts look different after conversion?",
      answer: "If the SVG references fonts that are not available to the renderer, text can fall back to another font. For consistent results, convert important text to outlines in Illustrator before exporting.",
    },
    {
      question: "Can Illustrator SVG effects be converted accurately?",
      answer: "Standard SVG shapes, fills, and gradients generally render as expected. Some editor-specific effects or external resources may not carry over, so review the PNG preview before downloading.",
    },
  ],
  "convert-png-to-svg-vector-logo": [
    {
      question: "Can a PNG logo be converted into a true vector SVG?",
      answer: "A raster-to-vector converter traces image regions into vector paths. The result is an editable SVG, but it is an approximation of the pixels and may need cleanup for complex artwork or lettering.",
    },
    {
      question: "What kind of PNG logo gives the cleanest vector trace?",
      answer: "Use a high-contrast image with a clear subject, clean edges, and limited colors. Small, blurry, or heavily textured source images usually produce more paths and less predictable results.",
    },
    {
      question: "Will the converted SVG preserve the exact original colors?",
      answer: "The trace estimates shapes and colors from the source pixels. Color quantization and smoothing can change small details, so inspect the SVG and adjust tracing settings when exact brand colors matter.",
    },
  ],
  "remove-background-from-product-photos": [
    {
      question: "What product photos work best for automatic background removal?",
      answer: "Photos with a clearly separated product, even lighting, and contrast between the subject and background are generally easier to segment. Hair, glass, shadows, and similar colors can need manual touch-up.",
    },
    {
      question: "Can I download a product cutout with transparency?",
      answer: "Yes. The removed background is transparent in the PNG output, allowing the product cutout to be placed on a store color or a new background.",
    },
    {
      question: "Will background removal change the product itself?",
      answer: "The segmentation process estimates which pixels belong to the foreground. Review the edges and fine details after processing, especially around reflective, translucent, or low-contrast areas.",
    },
  ],
  "svg-to-png-for-wordpress": [
    {
      question: "Why use PNG instead of SVG in WordPress?",
      answer: "PNG is a raster format supported by standard WordPress media workflows. It can be useful when SVG uploads are restricted by the site configuration or when a plugin expects raster images.",
    },
    {
      question: "What size should a WordPress logo PNG be?",
      answer: "Export at the largest size the theme will display, with extra pixels for high-density screens. Set the displayed dimensions in WordPress or the theme rather than enlarging a small export.",
    },
    {
      question: "Can the WordPress PNG keep a transparent background?",
      answer: "Yes. If the source SVG has transparent areas, the PNG can retain them. Confirm the source does not contain a solid background rectangle before converting.",
    },
  ],
  "svg-to-png-for-shopify": [
    {
      question: "When should I use a PNG logo in a Shopify theme?",
      answer: "PNG is useful when a theme section, app, or workflow expects a raster logo. If the theme supports SVG safely, SVG can remain sharper at different display sizes.",
    },
    {
      question: "How do I keep a Shopify logo crisp on mobile?",
      answer: "Export enough pixels for the largest display size and avoid enlarging the image in the theme. A transparent PNG also lets the logo sit over different header colors.",
    },
    {
      question: "Does the converted logo keep its transparent background?",
      answer: "Yes, provided the original SVG does not paint a background shape. Transparent pixels let the Shopify theme's header background show through.",
    },
  ],
  "svg-optimizer-for-web-performance": [
    {
      question: "What does an SVG optimizer remove or change?",
      answer: "An optimizer can reduce redundant markup, metadata, and unnecessary precision to make SVG code smaller. Review the optimized file to confirm its appearance and behavior remain correct.",
    },
    {
      question: "Will optimizing an SVG make my website faster?",
      answer: "A smaller SVG can reduce bytes transferred for that asset, but page speed depends on the full page, caching, network, and rendering. Measure the page before and after to see the actual effect.",
    },
    {
      question: "Should I keep the original SVG before optimizing it?",
      answer: "Yes. Keep a copy of the original so you can restore editor metadata or compare visual output if the optimized version does not work with your site.",
    },
  ],
  "svg-to-png-for-notion-and-obsidian": [
    {
      question: "Why use PNG icons in Notion or Obsidian?",
      answer: "A PNG can be convenient for page icons, covers, and diagrams when you need a raster image that previews consistently in a note or workspace.",
    },
    {
      question: "Can I use transparent PNGs in dark mode notes?",
      answer: "Yes. Transparent pixels reveal the note or workspace background, so the artwork can sit on both light and dark surfaces. Check that the SVG's own colors have enough contrast in each theme.",
    },
    {
      question: "What dimensions should I choose for a Notion or Obsidian image?",
      answer: "Choose dimensions based on how large the icon, cover, or diagram will appear. Exporting larger helps preserve detail when zoomed, while very large files can make notes slower to load.",
    },
  ],
};

export function getUseCaseFAQs(slug: string): UseCaseFAQ[] {
  return useCaseFaqs[slug] ?? [];
}
