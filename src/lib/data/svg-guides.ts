export interface SvgGuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface SvgGuide {
  slug: string;
  legacyId: string;
  title: string;
  description: string;
  sections: SvgGuideSection[];
}

export const svgGuides: SvgGuide[] = [
  {
    slug: "what-is-svg",
    legacyId: "what-is-svg",
    title: "What Is an SVG?",
    description: "Learn how Scalable Vector Graphics store artwork, why they stay sharp at different sizes, and when a raster format is a better fit.",
    sections: [
      {
        heading: "How SVG stores an image",
        paragraphs: [
          "Scalable Vector Graphics (SVG) is an XML-based format for two-dimensional artwork. Instead of recording a fixed grid of pixels, an SVG describes shapes, paths, text, fills, and strokes that a renderer draws on demand.",
          "That description lets a logo or icon render at different sizes without enlarging a fixed pixel grid. The actual appearance still depends on the SVG markup, referenced fonts, and the features supported by the renderer.",
        ],
        bullets: [
          "SVG is well suited to logos, icons, diagrams, and interface graphics.",
          "Raster formats such as PNG and JPEG store pixels and have fixed dimensions.",
          "An SVG can include text, styles, gradients, clipping paths, and other XML elements.",
        ],
      },
      {
        heading: "When to convert an SVG",
        paragraphs: [
          "Some apps, email clients, upload workflows, and image-processing tools expect raster files. In those cases, convert the SVG to a PNG or another supported format at the pixel dimensions needed for the destination.",
        ],
      },
    ],
  },
  {
    slug: "svg-vs-png",
    legacyId: "svg-vs-png",
    title: "SVG vs PNG: When to Use Each Format",
    description: "Compare vector SVG and raster PNG to choose the right image format for websites, logos, email, and detailed artwork.",
    sections: [
      {
        heading: "Use SVG for scalable vector artwork",
        paragraphs: [
          "Choose SVG for clean logos, icons, diagrams, and simple illustrations that need to resize across layouts or remain editable as vectors. SVG can also be styled or animated when embedded in a web page, subject to the way it is included and the browser's security rules.",
        ],
      },
      {
        heading: "Use PNG for fixed-size raster images",
        paragraphs: [
          "PNG is useful when a destination requires a raster image, when you need consistent rendering in an app that handles SVG inconsistently, or when the artwork contains transparency. PNG is lossless, but its pixel dimensions are fixed: enlarging it too far can make edges look soft.",
        ],
      },
      {
        heading: "Quick format checklist",
        paragraphs: [],
        bullets: [
          "Choose SVG for scalable icons, logos, and diagrams.",
          "Choose PNG for transparent raster assets and workflows that require pixels.",
          "Choose JPEG or WebP for many photographs, where lossy compression can reduce file size.",
          "When converting SVG to PNG, export at or above the largest display dimensions you need.",
        ],
      },
    ],
  },
  {
    slug: "optimize-svg",
    legacyId: "optimize-svg",
    title: "How to Optimize SVG Files",
    description: "Reduce unnecessary SVG markup while preserving the appearance, accessibility, and behavior your design needs.",
    sections: [
      {
        heading: "Remove markup the artwork does not need",
        paragraphs: [
          "Design tools can include editor metadata, hidden layers, comments, unused definitions, and empty groups in an SVG export. An optimizer can remove some of this data to reduce transfer size.",
        ],
        bullets: [
          "Remove editor-specific metadata and unused elements.",
          "Delete hidden or duplicate shapes only after confirming they are not needed for animation or interaction.",
          "Reduce excessive coordinate precision when the visual difference is not noticeable.",
        ],
      },
      {
        heading: "Preserve rendering and accessibility",
        paragraphs: [
          "Optimization can change markup, so compare the optimized file with the original in the browsers and apps where it will be used. Keep useful title and description text, and do not remove IDs or styles that scripts and CSS depend on.",
        ],
        bullets: [
          "Keep a copy of the original source before optimizing.",
          "Check gradients, clipping paths, masks, and fonts after optimization.",
          "Use an SVG optimizer and review its output rather than deleting elements blindly.",
        ],
      },
    ],
  },
  {
    slug: "use-svg-on-web",
    legacyId: "use-on-web",
    title: "How to Use SVGs on Websites",
    description: "Understand the common ways to add SVG graphics to a web page and the tradeoffs for styling, caching, and security.",
    sections: [
      {
        heading: "Inline SVG markup",
        paragraphs: [
          "Inline SVG places the <svg> element directly in the document. It can be useful when CSS needs to style individual paths or when the graphic needs page-level interaction. The markup becomes part of the HTML, so large inline graphics can increase document size.",
        ],
      },
      {
        heading: "SVG as an image source",
        paragraphs: [
          "An <img> element referencing an SVG file keeps the markup separate and allows normal image caching. The SVG's internal elements are not available for page CSS styling through the image element.",
        ],
      },
      {
        heading: "SVG as a CSS background",
        paragraphs: [
          "A CSS background image works well for decorative artwork and repeating patterns. It does not provide the same text alternative as a semantic image, so do not use it as the only way to communicate meaningful content.",
        ],
      },
      {
        heading: "Handle SVG files safely",
        paragraphs: [
          "Only embed or serve SVG files from sources you trust. If users can upload SVGs, validate and sanitize them on the server before serving them, and apply an appropriate content security policy.",
        ],
      },
    ],
  },
  {
    slug: "svg-best-practices",
    legacyId: "best-practices",
    title: "SVG Best Practices",
    description: "Prepare SVG artwork that scales reliably, renders with the intended typography, and remains understandable to assistive technology.",
    sections: [
      {
        heading: "Set a useful viewBox",
        paragraphs: [
          "The viewBox defines the coordinate system and visible region of an SVG. Use one that covers the intended artwork so the image scales proportionally inside responsive containers and conversion tools.",
        ],
      },
      {
        heading: "Make typography predictable",
        paragraphs: [
          "If an SVG relies on a font that is not installed in the destination environment, the renderer may substitute another font. Convert text to paths when exact appearance is more important than keeping the text editable, or make the font available through a supported method.",
        ],
      },
      {
        heading: "Add accessible descriptions",
        paragraphs: [
          "For meaningful graphics, include a concise accessible name or provide equivalent text nearby. SVG title and description elements can help when the SVG is used in a way that exposes its accessibility tree.",
        ],
        bullets: [
          "Use a descriptive file name and a meaningful text alternative where the image is placed.",
          "Keep contrast and stroke widths suitable for the intended size.",
          "Remove unused metadata, then check the final artwork at its actual display dimensions.",
        ],
      },
    ],
  },
  {
    slug: "svg-common-problems",
    legacyId: "common-problems",
    title: "Common SVG Problems and How to Fix Them",
    description: "Troubleshoot blank or clipped SVGs, missing fonts, and effects that look different after rendering or conversion.",
    sections: [
      {
        heading: "The SVG appears blank or clipped",
        paragraphs: [
          "Check that the viewBox covers the coordinates used by the paths and that width and height are valid. Also inspect clipping paths, masks, and overflow rules that may hide artwork outside the expected region.",
        ],
      },
      {
        heading: "Text uses the wrong font",
        paragraphs: [
          "The viewing environment may not have the source font. Convert important text to outlines before export when visual fidelity matters, or ensure the required font is available to the renderer.",
        ],
      },
      {
        heading: "Gradients or shadows are missing",
        paragraphs: [
          "Verify that each effect is defined and referenced correctly. Check IDs used by gradients and filters, and confirm that the target browser or conversion tool supports the SVG feature being used.",
        ],
      },
    ],
  },
  {
    slug: "svg-to-png-email",
    legacyId: "svg-to-png-email",
    title: "How to Convert SVG to PNG for Outlook and Gmail",
    description: "Prepare a raster logo for HTML email when SVG rendering is inconsistent across email clients.",
    sections: [
      {
        heading: "Why email uses PNG fallbacks",
        paragraphs: [
          "Email clients vary in how they handle linked and inline SVG. A PNG fallback can make a logo or banner more predictable across clients that restrict or fail to display SVG content.",
        ],
      },
      {
        heading: "Export at the right dimensions",
        paragraphs: [
          "Choose pixel dimensions based on the image's displayed size in the email. For a logo shown at 300 CSS pixels on a high-density display, an export around 600 pixels wide can provide extra detail, provided the file size remains suitable.",
        ],
      },
      {
        heading: "Keep transparency and include a fallback",
        paragraphs: [
          "Use a transparent PNG when the logo needs to sit on the email's background color. Include meaningful alt text on the image and test the message in the email clients your audience uses.",
        ],
      },
    ],
  },
  {
    slug: "figma-svg-transparent-png",
    legacyId: "figma-svg-to-transparent-png",
    title: "Export a Transparent PNG from Figma SVG",
    description: "Export vector artwork from Figma as SVG, preserve an empty background, and render a PNG at the dimensions your design needs.",
    sections: [
      {
        heading: "Copy or export the frame as SVG",
        paragraphs: [
          "Select the frame or asset in Figma and export it as SVG, or use Figma's copy-as-SVG action. The SVG can then be rendered at custom pixel dimensions instead of being limited to a small preset raster export.",
        ],
      },
      {
        heading: "Make the background transparent",
        paragraphs: [
          "If the final PNG should be transparent, disable the frame's background fill before exporting. A background rectangle included in the SVG will be rendered as part of the image.",
        ],
      },
      {
        heading: "Choose output dimensions and review the result",
        paragraphs: [
          "Set the output width and height for the final use, then inspect text, gradients, shadows, and layer effects in the PNG preview. Some effects or fonts may be represented differently by another renderer, so compare the result with the Figma frame.",
        ],
      },
    ],
  },
  {
    slug: "why-svg-fails-email",
    legacyId: "why-svg-not-showing-gmail",
    title: "Why SVG Images Fail in Email Clients",
    description: "Learn why SVG logos may disappear in email and how a PNG fallback, alt text, and client testing can make campaigns more reliable.",
    sections: [
      {
        heading: "Email support differs by client",
        paragraphs: [
          "Email apps use different rendering engines and security rules. Some clients block, strip, or inconsistently display SVG in HTML email, so an SVG that works in a browser may not appear for every recipient.",
        ],
      },
      {
        heading: "Use a raster fallback",
        paragraphs: [
          "For a logo or decorative graphic, provide a PNG fallback at dimensions suited to its display size. If you use a modern image format, include a compatible fallback for the email clients you need to support.",
        ],
      },
      {
        heading: "Test the complete email",
        paragraphs: [
          "Send test messages to representative clients and devices. Check image loading, transparency against the email background, image dimensions, and the alt text shown when images are disabled.",
        ],
      },
    ],
  },
];

export function getSvgGuide(slug: string): SvgGuide | undefined {
  return svgGuides.find((guide) => guide.slug === slug);
}
