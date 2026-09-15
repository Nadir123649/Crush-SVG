export interface UseCase {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  icon: string;
  features: string[];
}

export const useCases: UseCase[] = [
  {
    slug: 'svg-to-png-for-react',
    title: 'Convert SVG to PNG for React & Next.js Apps',
    h1: 'SVG to PNG Converter for React',
    description: 'Convert complex SVG code into optimized transparent PNGs for React components. Ideal for fallback assets, Open Graph meta tags, and older browser support.',
    keywords: ['react svg to png', 'nextjs svg to png', 'convert svg to png react', 'react vector image'],
    icon: 'REACT',
    features: ['Perfect for OG Image generation', 'Fallback for older browsers', 'Zero-config conversion'],
  },
  {
    slug: 'svg-to-png-for-email-signatures',
    title: 'Convert SVG to PNG for HTML Email Signatures',
    h1: 'SVG to PNG Converter for Email Signatures',
    description: 'Email clients like Outlook and Gmail do not support SVG files. Convert vector logos into crisp, high-resolution PNGs for bulletproof HTML email signatures.',
    keywords: ['email signature svg', 'outlook svg support', 'gmail svg to png', 'email vector logo'],
    icon: 'EMAIL',
    features: ['100% compatible with Outlook & Gmail', 'Preserves transparency', 'High-resolution output'],
  },
  {
    slug: 'svg-to-png-transparent-background',
    title: 'Convert SVG to PNG with Transparent Background',
    h1: 'SVG to Transparent PNG Converter',
    description: 'Preserve alpha channel transparency when converting vector graphics. Generate high-quality PNGs with fully transparent backgrounds for UI overlays & design.',
    keywords: ['svg to transparent png', 'png alpha channel', 'transparent vector to png', 'remove background svg'],
    icon: 'ALPHA',
    features: ['Maintains alpha channel', 'No white backgrounds', 'Perfect for UI overlays'],
  },
  {
    slug: 'high-resolution-svg-to-png',
    title: 'High-Resolution SVG to PNG Image Converter',
    h1: 'High-Res SVG to PNG Converter',
    description: 'Scale vector graphics up to 16x their size without losing quality. Generate ultra high-definition 4K PNGs for posters, print merchandise, and retina displays.',
    keywords: ['high res svg to png', '4k svg to png', 'scale svg to png', 'print quality svg converter'],
    icon: '4K',
    features: ['Up to 16x scaling', 'Print-ready resolution', 'No pixelation or blurring'],
  },
  {
    slug: 'svg-to-png-for-cricut',
    title: 'Convert SVG to PNG for Cricut & Cutting Machines',
    h1: 'SVG to PNG Converter for Cricut Design Space',
    description: 'Prepare vector cut files for Cricut Design Space, Silhouette Studio, and laser cutters with crisp edges, transparent backgrounds, and 300 DPI resolution.',
    keywords: ['cricut svg to png', 'cricut design space svg converter', 'silhouette svg to png', 'laser cutting svg converter', 'vinyl cut file png'],
    icon: 'CRICUT',
    features: ['Optimized for Cricut Design Space & Silhouette', 'Crisp cut edges without jagged pixels', 'Full alpha transparency support'],
  },
  {
    slug: 'svg-to-png-for-canva',
    title: 'Convert SVG to PNG for Canva Graphics & Templates',
    h1: 'SVG to PNG Converter for Canva',
    description: 'Convert custom vector illustrations and brand logos into high-res transparent PNGs ready for Canva drag-and-drop templates, Instagram stories, and thumbnails.',
    keywords: ['canva svg to png', 'convert vector for canva', 'upload svg to canva png', 'canva transparent logo'],
    icon: 'CANVA',
    features: ['100% compatible with Canva drag-and-drop', 'Preserves gradients, colors & fonts', 'Perfect for social media banners & thumbnails'],
  },
  {
    slug: 'svg-to-png-for-word-powerpoint',
    title: 'Convert SVG to PNG for MS Word & PowerPoint',
    h1: 'SVG to PNG for PowerPoint & Microsoft Word',
    description: 'Fix blurry vector graphics in Microsoft Office. Convert SVGs to ultra-sharp PNGs that render perfectly in PowerPoint slide decks and Word document reports.',
    keywords: ['svg to png powerpoint', 'blurry svg in word fix', 'svg to png microsoft office', 'powerpoint vector logo'],
    icon: 'OFFICE',
    features: ['Fixes blurry vector display in MS Office', 'Embeds cleanly in PowerPoint presentations', 'Crisp rendering on retina and 4K monitors'],
  },
  {
    slug: 'figma-svg-to-high-res-png',
    title: 'Convert Figma SVG to High-Resolution PNG (16x)',
    h1: 'Figma SVG to High-Resolution PNG Converter',
    description: 'Export SVG code directly from Figma and render into ultra-sharp, anti-aliased PNGs with custom scaling up to 16x resolution and studio-grade fidelity.',
    keywords: ['figma svg to png', 'export figma svg 4x png', 'figma vector to high res png', 'figma icon to transparent png'],
    icon: 'FIGMA',
    features: ['Direct SVG code paste from Figma', 'Preserves Figma layer effects & gradients', 'Scalable up to 16x for retina assets'],
  },
  {
    slug: 'svg-to-png-for-print-300-dpi',
    title: 'Convert SVG to 300 DPI Print-Ready PNG Image',
    h1: 'SVG to 300 DPI Print-Ready PNG Converter',
    description: 'Scale vector illustrations into print-grade, ultra-dense 300 DPI PNGs for merchandise, apparel, t-shirt printing, business cards, posters, and packaging.',
    keywords: ['svg to 300 dpi png', 'print ready svg converter', 't shirt printing svg to png', 'convert svg to high dpi image'],
    icon: 'PRINT',
    features: ['Dense 300 DPI print-ready rendering', 'Massive resolution support (up to 4000x4000px)', 'Ideal for merch, apparel & posters'],
  },
  {
    slug: 'svg-to-ico-favicon-pack',
    title: 'Convert SVG to Favicon (.ICO) & Web Icons Pack',
    h1: 'SVG to Favicon (.ICO) Pack Generator',
    description: 'Generate multi-resolution favicon.ico (16x16, 32x32, 48x48), Apple Touch icons, and site.webmanifest from any SVG vector file in seconds with 1-click ZIP.',
    keywords: ['svg to ico', 'convert svg to favicon', 'favicon pack generator', 'apple touch icon generator', 'svg to multi resolution ico'],
    icon: 'FAVICON',
    features: ['Multi-resolution 16/32/48 ICO packaging', 'Apple Touch (180x180) & Android manifest', '1-click complete ZIP download'],
  },
  {
    slug: 'svg-to-webp-converter',
    title: 'Convert SVG to WebP for Fast Website Performance',
    h1: 'SVG to Modern WebP Converter',
    description: 'Convert complex SVG vector graphics into modern, lightweight WebP raster images with full alpha transparency and maximum compression for Google Core Web Vitals.',
    keywords: ['svg to webp', 'convert svg to webp', 'vector to webp online', 'lightweight webp from svg'],
    icon: 'WEBP',
    features: ['Up to 80% smaller file sizes than PNG', 'Full 32-bit alpha transparency', 'Improves Google Core Web Vitals & LCP'],
  },
  {
    slug: 'convert-illustrator-svg-to-png',
    title: 'Convert Adobe Illustrator SVG to Transparent PNG',
    h1: 'Adobe Illustrator SVG to PNG Converter',
    description: 'Clean up bloated Adobe Illustrator SVG exports, strip Illustrator XML doctypes and namespaces, and render pixel-perfect high-resolution PNG images instantly.',
    keywords: ['illustrator svg to png', 'adobe illustrator export svg to png', 'clean illustrator svg', 'ai svg rasterizer'],
    icon: 'ILLUSTRATOR',
    features: ['Cleans Adobe Illustrator XML junk', 'Accurate gradient & layer blending', 'High-res export up to 16x scale'],
  },
  {
    slug: 'convert-png-to-svg-vector-logo',
    title: 'Convert PNG Logo to Scalable SVG Vector Online',
    h1: 'PNG Logo to SVG Vector Converter',
    description: 'Trace bitmap logos, sketches, and graphics into infinitely scalable SVG vector paths with multi-color quantization, curve smoothing, and zero loss of quality.',
    keywords: ['png logo to svg', 'trace bitmap to vector', 'convert logo to vector svg', 'raster to vector converter'],
    icon: 'VECTOR',
    features: ['Multi-color vector tracing', 'Corner smoothing & curve tuning', 'Infinitely scalable vector output'],
  },
  {
    slug: 'remove-background-from-product-photos',
    title: 'Remove Background from E-Commerce Product Photos',
    h1: 'AI Background Remover for Product Photos',
    description: 'Create clean, studio-grade transparent PNG product cutouts for Amazon, Shopify, eBay, and Etsy store listings instantly with AI browser segmentation.',
    keywords: ['product photo background remover', 'transparent png for amazon', 'shopify product background removal', 'white background to transparent'],
    icon: 'BGREMOVE',
    features: ['Instant browser-side AI segmentation', 'Clean edge feathering & transparency', 'Ready for Amazon, Shopify & Etsy'],
  },
  {
    slug: 'svg-to-png-for-wordpress',
    title: 'Convert SVG to PNG for WordPress Sites & Themes',
    h1: 'SVG to PNG Converter for WordPress',
    description: 'Bypass WordPress SVG upload security blocks by converting vector logos, icons, and hero illustrations into safe, high-speed, retina-ready PNG assets.',
    keywords: ['wordpress svg to png', 'elementor svg upload fix', 'wordpress logo png', 'convert vector for wordpress'],
    icon: 'WORDPRESS',
    features: ['100% compatible with all WordPress themes', 'No insecure SVG plugin required', 'Retina display sharpness'],
  },
  {
    slug: 'svg-to-png-for-shopify',
    title: 'Convert SVG to PNG for Shopify Stores & Headers',
    h1: 'SVG to PNG Converter for Shopify',
    description: 'Prepare crystal-clear logos, payment badges, trust seals, and product badges for Shopify theme headers, footers, checkout pages, and mobile displays.',
    keywords: ['shopify svg to png', 'shopify trust badges png', 'shopify logo vector to png', 'shopify theme image converter'],
    icon: 'SHOPIFY',
    features: ['Optimized for Shopify theme headers & badges', 'Crisp display on mobile screens', 'Transparent background preservation'],
  },
  {
    slug: 'svg-optimizer-for-web-performance',
    title: 'Optimize & Minify SVG Files for Core Web Vitals',
    h1: 'SVG Optimizer for Website Speed & Core Web Vitals',
    description: 'Compress bloated SVG code, strip editor metadata, clean empty tags, and round coordinate precision to boost PageSpeed Insights scores and LCP performance.',
    keywords: ['svg optimizer', 'minify svg for pagespeed', 'reduce svg file size', 'svg compression for web performance'],
    icon: 'OPTIMIZE',
    features: ['Lossless vector code compression', 'Improves LCP and INP performance', 'Instant in-browser processing with zero lag'],
  },
  {
    slug: 'svg-to-png-for-notion-and-obsidian',
    title: 'Convert SVG to PNG for Notion & Obsidian Notes',
    h1: 'SVG to PNG Converter for Notion & Obsidian',
    description: 'Render custom vector icons, architecture diagrams, and mind maps into sharp transparent PNGs for Notion workspaces, Obsidian notes, and personal wikis.',
    keywords: ['notion svg to png', 'obsidian vector icon png', 'diagram svg to png', 'notion workspace icon converter'],
    icon: 'NOTION',
    features: ['Perfect for Notion page icons & covers', 'Supports dark and light mode notes', 'High-res diagram rasterization'],
  }
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return useCases.find((uc) => uc.slug === slug);
}
