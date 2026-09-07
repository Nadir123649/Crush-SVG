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
  }
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return useCases.find((uc) => uc.slug === slug);
}
