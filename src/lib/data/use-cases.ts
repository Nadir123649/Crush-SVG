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
    title: 'Convert SVG to PNG for React & Next.js Applications',
    h1: 'SVG to PNG Converter for React',
    description: 'Easily convert complex SVGs into optimized PNGs for your React components. Perfect for fallback images, Open Graph meta tags, and older browser support.',
    keywords: ['react svg to png', 'nextjs svg to png', 'convert svg to png react', 'react vector image'],
    icon: 'REACT',
    features: ['Perfect for OG Image generation', 'Fallback for older browsers', 'Zero-config conversion'],
  },
  {
    slug: 'svg-to-png-for-email-signatures',
    title: 'Convert SVG to PNG for Email Signatures',
    h1: 'SVG to PNG Converter for Email Signatures',
    description: 'Most email clients like Outlook and Gmail do not support SVGs. Convert your vector logos into crisp, high-resolution PNGs for perfect email signatures.',
    keywords: ['email signature svg', 'outlook svg support', 'gmail svg to png', 'email vector logo'],
    icon: 'EMAIL',
    features: ['100% compatible with Outlook & Gmail', 'Preserves transparency', 'High-resolution output'],
  },
  {
    slug: 'svg-to-png-transparent-background',
    title: 'Convert SVG to PNG with Transparent Background',
    h1: 'SVG to Transparent PNG Converter',
    description: 'Preserve the alpha channel and transparency of your SVGs. Generate high-quality PNGs with fully transparent backgrounds for web and graphic design.',
    keywords: ['svg to transparent png', 'png alpha channel', 'transparent vector to png', 'remove background svg'],
    icon: 'ALPHA',
    features: ['Maintains alpha channel', 'No white backgrounds', 'Perfect for UI overlays'],
  },
  {
    slug: 'high-resolution-svg-to-png',
    title: 'High Resolution SVG to PNG Converter',
    h1: 'High-Res SVG to PNG Converter',
    description: 'Scale your SVGs up to 16x their original size without losing quality. Generate ultra high-definition PNGs for print, posters, and 4K displays.',
    keywords: ['high res svg to png', '4k svg to png', 'scale svg to png', 'print quality svg converter'],
    icon: '4K',
    features: ['Up to 16x scaling', 'Print-ready resolution', 'No pixelation or blurring'],
  },
  {
    slug: 'svg-to-png-for-cricut',
    title: 'Convert SVG to PNG for Cricut & Silhouette Cutting Machines',
    h1: 'SVG to PNG Converter for Cricut Design Space',
    description: 'Prepare your vector graphics and cut files for Cricut Design Space, Silhouette Studio, and laser cutters with crisp edges, transparent backgrounds, and ultra-high resolution.',
    keywords: ['cricut svg to png', 'cricut design space svg converter', 'silhouette svg to png', 'laser cutting svg converter', 'vinyl cut file png'],
    icon: 'CRICUT',
    features: ['Optimized for Cricut Design Space & Silhouette', 'Crisp cut edges without jagged pixels', 'Full alpha transparency support'],
  },
  {
    slug: 'svg-to-png-for-canva',
    title: 'Convert SVG to PNG for Canva Graphics & Social Media',
    h1: 'SVG to PNG Converter for Canva',
    description: 'Convert custom vector illustrations, brand marks, and icons into high-res transparent PNGs ready to drop straight into Canva templates, Instagram stories, and YouTube thumbnails.',
    keywords: ['canva svg to png', 'convert vector for canva', 'upload svg to canva png', 'canva transparent logo'],
    icon: 'CANVA',
    features: ['100% compatible with Canva drag-and-drop', 'Preserves gradients, colors & fonts', 'Perfect for social media banners & thumbnails'],
  },
  {
    slug: 'svg-to-png-for-word-powerpoint',
    title: 'Convert SVG to PNG for Microsoft Word, PowerPoint & Office',
    h1: 'SVG to PNG for PowerPoint & Microsoft Word',
    description: 'Fix blurry vector icons and compatibility glitches in Microsoft Office. Convert SVGs to ultra-sharp PNGs that render perfectly in PowerPoint slide decks, Word reports, and Excel spreadsheets.',
    keywords: ['svg to png powerpoint', 'blurry svg in word fix', 'svg to png microsoft office', 'powerpoint vector logo'],
    icon: 'OFFICE',
    features: ['Fixes blurry vector display in MS Office', 'Embeds cleanly in PowerPoint presentations', 'Crisp rendering on retina and 4K monitors'],
  },
  {
    slug: 'figma-svg-to-high-res-png',
    title: 'Convert Figma SVG to High-Resolution PNG (2x, 4x, 8x)',
    h1: 'Figma SVG to High-Resolution PNG Converter',
    description: 'Export SVG code and vector assets directly from Figma and render them into ultra-sharp, anti-aliased PNGs with custom scaling up to 16x and studio-grade fidelity.',
    keywords: ['figma svg to png', 'export figma svg 4x png', 'figma vector to high res png', 'figma icon to transparent png'],
    icon: 'FIGMA',
    features: ['Direct SVG code paste from Figma', 'Preserves Figma layer effects & gradients', 'Scalable up to 16x for retina assets'],
  },
  {
    slug: 'svg-to-png-for-print-300-dpi',
    title: 'Convert SVG to 300 DPI Print-Ready PNG',
    h1: 'SVG to 300 DPI Print-Ready PNG Converter',
    description: 'Scale vector illustrations into print-grade, ultra-dense 300 DPI PNGs for merchandise, apparel, t-shirt printing, business cards, posters, and packaging.',
    keywords: ['svg to 300 dpi png', 'print ready svg converter', 't shirt printing svg to png', 'convert svg to high dpi image'],
    icon: 'PRINT',
    features: ['Dense 300 DPI print-ready rendering', 'Massive resolution support (up to 4000x4000px)', 'Ideal for merch, apparel & posters'],
  }
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return useCases.find((uc) => uc.slug === slug);
}
