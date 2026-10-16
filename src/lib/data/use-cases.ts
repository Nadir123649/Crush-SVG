export interface LocalizedUseCaseContent {
  title: string;
  h1: string;
  highlight?: string;
  description: string;
  features: string[];
}

export interface UseCase {
  slug: string;
  title: string;
  h1: string;
  /** Phrase within h1 shown in brand orange; defaults to the text after " for ". */
  highlight?: string;
  description: string;
  keywords: string[];
  icon: string;
  category: string;
  features: string[];
  /** Portuguese translations; falls back to the English fields when absent. */
  pt?: LocalizedUseCaseContent;
}

export const useCases: UseCase[] = [
  {
    slug: 'svg-to-png-for-react',
    title: 'Convert SVG to PNG for React & Next.js Apps',
    h1: 'SVG to PNG Converter for React',
    description: 'Convert complex SVG code into optimized transparent PNGs for React components. Ideal for fallback assets, Open Graph meta tags, and older browser support.',
    keywords: ['react svg to png', 'nextjs svg to png', 'convert svg to png react', 'react vector image'],
    icon: 'REACT',
    category: 'Web & Dev',
    features: ['Perfect for OG Image generation', 'Fallback for older browsers', 'Zero-config conversion'],
    pt: {
      title: 'Converta SVG para PNG em apps React e Next.js',
      h1: 'Conversor de SVG para React',
      highlight: 'React',
      description: 'Converta código SVG complexo em PNGs transparentes e otimizados para componentes React. Ideal para imagens de fallback, meta tags Open Graph e navegadores mais antigos.',
      features: ['Perfeito para gerar imagens OG', 'Fallback para navegadores antigos', 'Conversão sem configuração'],
    },
  },
  {
    slug: 'svg-to-png-for-email-signatures',
    title: 'Convert SVG to PNG for HTML Email Signatures',
    h1: 'SVG to PNG Converter for Email Signatures',
    description: 'Email clients like Outlook and Gmail do not support SVG files. Convert vector logos into crisp, high-resolution PNGs for bulletproof HTML email signatures.',
    keywords: ['email signature svg', 'outlook svg support', 'gmail svg to png', 'email vector logo'],
    icon: 'EMAIL',
    category: 'Email',
    features: ['100% compatible with Outlook & Gmail', 'Preserves transparency', 'High-resolution output'],
    pt: {
      title: 'Converta SVG para PNG para assinaturas de e-mail HTML',
      h1: 'Conversor de SVG para PNG para assinaturas de e-mail',
      highlight: 'assinaturas de e-mail',
      description: 'Clientes de e-mail como Outlook e Gmail não suportam arquivos SVG. Converta logotipos vetoriais em PNGs nítidos e em alta resolução para assinaturas de e-mail HTML à prova de falhas.',
      features: ['100% compatível com Outlook e Gmail', 'Preserva a transparência', 'Saída em alta resolução'],
    },
  },
  {
    slug: 'svg-to-png-transparent-background',
    title: 'Convert SVG to PNG with Transparent Background',
    h1: 'SVG to Transparent PNG Converter',
    highlight: 'Transparent PNG',
    description: 'Preserve alpha channel transparency when converting vector graphics. Generate high-quality PNGs with fully transparent backgrounds for UI overlays & design.',
    keywords: ['svg to transparent png', 'png alpha channel', 'transparent vector to png', 'remove background svg'],
    icon: 'ALPHA',
    category: 'Image Quality',
    features: ['Maintains alpha channel', 'No white backgrounds', 'Perfect for UI overlays'],
    pt: {
      title: 'Converta SVG para PNG com fundo transparente',
      h1: 'Conversor de SVG para PNG transparente',
      highlight: 'PNG transparente',
      description: 'Preserve a transparência do canal alfa ao converter gráficos vetoriais. Gere PNGs de alta qualidade com fundos totalmente transparentes para interfaces e design.',
      features: ['Mantém o canal alfa', 'Sem fundos brancos', 'Perfeito para sobreposições de UI'],
    },
  },
  {
    slug: 'high-resolution-svg-to-png',
    title: 'High-Resolution SVG to PNG Image Converter',
    h1: 'High-Res SVG to PNG Converter',
    highlight: 'SVG to PNG',
    description: 'Scale vector graphics up to 16x their size (output capped at 4000px per side) without losing quality. Generate ultra high-definition 4K PNGs for posters, print merchandise, and retina displays.',
    keywords: ['high res svg to png', '4k svg to png', 'scale svg to png', 'print quality svg converter'],
    icon: '4K',
    category: 'Image Quality',
    features: ['Up to 16x scaling (max 4000px per side)', 'Print-ready resolution', 'No pixelation or blurring'],
    pt: {
      title: 'Conversor de imagens SVG para PNG em alta resolução',
      h1: 'Conversor de SVG para PNG em alta resolução',
      highlight: 'SVG para PNG',
      description: 'Amplie gráficos vetoriais até 16x o tamanho (saída limitada a 4000px por lado) sem perder qualidade. Gere PNGs em ultra alta definição 4K para pôsteres, produtos impressos e telas retina.',
      features: ['Até 16x de escala (máx. 4000px por lado)', 'Resolução pronta para impressão', 'Sem pixelação ou desfoque'],
    },
  },
  {
    slug: 'svg-to-png-for-cricut',
    title: 'Convert SVG to PNG for Cricut & Cutting Machines',
    h1: 'SVG to PNG Converter for Cricut Design Space',
    description: 'Prepare vector cut files for Cricut Design Space, Silhouette Studio, and laser cutters with crisp edges, transparent backgrounds, and 300 DPI resolution.',
    keywords: ['cricut svg to png', 'cricut design space svg converter', 'silhouette svg to png', 'laser cutting svg converter', 'vinyl cut file png'],
    icon: 'CRICUT',
    category: 'Print & Craft',
    features: ['Optimized for Cricut Design Space & Silhouette', 'Crisp cut edges without jagged pixels', 'Full alpha transparency support'],
    pt: {
      title: 'Converta SVG para PNG para Cricut e máquinas de corte',
      h1: 'Conversor de SVG para PNG para Cricut Design Space',
      highlight: 'Cricut Design Space',
      description: 'Prepare arquivos vetoriais de corte para Cricut Design Space, Silhouette Studio e cortadoras a laser com bordas nítidas, fundos transparentes e resolução de 300 DPI.',
      features: ['Otimizado para Cricut Design Space e Silhouette', 'Bordas de corte nítidas sem pixels irregulares', 'Suporte completo a transparência alfa'],
    },
  },
  {
    slug: 'svg-to-png-for-canva',
    title: 'Convert SVG to PNG for Canva Graphics & Templates',
    h1: 'SVG to PNG Converter for Canva',
    description: 'Convert custom vector illustrations and brand logos into high-res transparent PNGs ready for Canva drag-and-drop templates, Instagram stories, and thumbnails.',
    keywords: ['canva svg to png', 'convert vector for canva', 'upload svg to canva png', 'canva transparent logo'],
    icon: 'CANVA',
    category: 'Design Tools',
    features: ['100% compatible with Canva drag-and-drop', 'Preserves gradients, colors & fonts', 'Perfect for social media banners & thumbnails'],
    pt: {
      title: 'Converta SVG para PNG para gráficos e modelos do Canva',
      h1: 'Conversor de SVG para PNG para Canva',
      highlight: 'Canva',
      description: 'Converta ilustrações vetoriais personalizadas e logotipos de marca em PNGs transparentes em alta resolução, prontos para modelos do Canva, stories do Instagram e miniaturas.',
      features: ['100% compatível com o arrastar e soltar do Canva', 'Preserva gradientes, cores e fontes', 'Perfeito para banners de redes sociais e miniaturas'],
    },
  },
  {
    slug: 'svg-to-png-for-word-powerpoint',
    title: 'Convert SVG to PNG for MS Word & PowerPoint',
    h1: 'SVG to PNG for PowerPoint & Microsoft Word',
    description: 'Fix blurry vector graphics in Microsoft Office. Convert SVGs to ultra-sharp PNGs that render perfectly in PowerPoint slide decks and Word document reports.',
    keywords: ['svg to png powerpoint', 'blurry svg in word fix', 'svg to png microsoft office', 'powerpoint vector logo'],
    icon: 'OFFICE',
    category: 'Design Tools',
    features: ['Fixes blurry vector display in MS Office', 'Embeds cleanly in PowerPoint presentations', 'Crisp rendering on retina and 4K monitors'],
    pt: {
      title: 'Converta SVG para PNG para MS Word e PowerPoint',
      h1: 'SVG para PNG para PowerPoint e Microsoft Word',
      highlight: 'PowerPoint e Microsoft Word',
      description: 'Corrija gráficos vetoriais desfocados no Microsoft Office. Converta SVGs em PNGs ultra nítidos que renderizam perfeitamente em apresentações do PowerPoint e documentos do Word.',
      features: ['Corrige a exibição desfocada de vetores no MS Office', 'Incorpora-se limpos em apresentações do PowerPoint', 'Renderização nítida em monitores retina e 4K'],
    },
  },
  {
    slug: 'figma-svg-to-high-res-png',
    title: 'Convert Figma SVG to High-Resolution PNG (16x)',
    h1: 'Figma SVG to High-Resolution PNG Converter',
    highlight: 'High-Resolution PNG',
    description: 'Export SVG code directly from Figma and render into ultra-sharp, anti-aliased PNGs with custom scaling up to 16x (output capped at 4000px per side) and studio-grade fidelity.',
    keywords: ['figma svg to png', 'export figma svg 4x png', 'figma vector to high res png', 'figma icon to transparent png'],
    icon: 'FIGMA',
    category: 'Design Tools',
    features: ['Direct SVG code paste from Figma', 'Preserves Figma layer effects & gradients', 'Scalable up to 16x for retina assets (max 4000px per side)'],
    pt: {
      title: 'Converta SVG do Figma para PNG em alta resolução (16x)',
      h1: 'Conversor de SVG do Figma para PNG em alta resolução',
      highlight: 'PNG em alta resolução',
      description: 'Exporte código SVG diretamente do Figma e renderize em PNGs ultra nítidos com antisserrilhado, com escala personalizada de até 16x (saída limitada a 4000px por lado) e fidelidade de estúdio.',
      features: ['Cole o código SVG direto do Figma', 'Preserva efeitos de camada e gradientes do Figma', 'Escala de até 16x para assets retina (máx. 4000px por lado)'],
    },
  },
  {
    slug: 'svg-to-png-for-print-300-dpi',
    title: 'Convert SVG to 300 DPI Print-Ready PNG Image',
    h1: 'SVG to 300 DPI Print-Ready PNG Converter',
    highlight: '300 DPI Print-Ready PNG',
    description: 'Scale vector illustrations into print-grade, ultra-dense 300 DPI PNGs for merchandise, apparel, t-shirt printing, business cards, posters, and packaging.',
    keywords: ['svg to 300 dpi png', 'print ready svg converter', 't shirt printing svg to png', 'convert svg to high dpi image'],
    icon: 'PRINT',
    category: 'Print & Craft',
    features: ['Dense 300 DPI print-ready rendering', 'Massive resolution support (up to 4000x4000px)', 'Ideal for merch, apparel & posters'],
    pt: {
      title: 'Converta SVG para PNG pronto para impressão em 300 DPI',
      h1: 'Conversor de SVG para PNG pronto para impressão em 300 DPI',
      highlight: 'PNG pronto para impressão em 300 DPI',
      description: 'Escale ilustrações vetoriais para PNGs densos de 300 DPI em nível profissional, para merchandise, camisetas, cartões de visita, pôsteres e embalagens.',
      features: ['Renderização densa de 300 DPI pronta para impressão', 'Suporte a resoluções gigantes (até 4000x4000px)', 'Ideal para merchandising, roupas e pôsteres'],
    },
  },
  {
    slug: 'svg-to-ico-favicon-pack',
    title: 'Convert SVG to Favicon (.ICO) & Web Icons Pack',
    h1: 'SVG to Favicon (.ICO) Pack Generator',
    highlight: 'Favicon (.ICO) Pack',
    description: 'Generate multi-resolution favicon.ico (16x16, 32x32, 48x48), Apple Touch icons, and site.webmanifest from any SVG vector file in seconds with 1-click ZIP.',
    keywords: ['svg to ico', 'convert svg to favicon', 'favicon pack generator', 'apple touch icon generator', 'svg to multi resolution ico'],
    icon: 'FAVICON',
    category: 'Web & Dev',
    features: ['Multi-resolution 16/32/48 ICO packaging', 'Apple Touch (180x180) & Android manifest', '1-click complete ZIP download'],
    pt: {
      title: 'Converta SVG para favicon (.ICO) e pacote de ícones web',
      h1: 'Gerador de pacote de SVG para favicon (.ICO)',
      highlight: 'favicon (.ICO)',
      description: 'Gere favicons multi-resolução (16x16, 32x32, 48x48), ícones Apple Touch e site.webmanifest a partir de qualquer arquivo SVG em segundos, com download ZIP em 1 clique.',
      features: ['Empacotamento ICO multi-resolução 16/32/48', 'Apple Touch (180x180) e manifesto Android', 'Download ZIP completo em 1 clique'],
    },
  },
  {
    slug: 'svg-to-webp-converter',
    title: 'Convert SVG to WebP for Fast Website Performance',
    h1: 'SVG to Modern WebP Converter',
    highlight: 'Modern WebP',
    description: 'Convert complex SVG vector graphics into modern, lightweight WebP raster images with full alpha transparency and maximum compression for Google Core Web Vitals.',
    keywords: ['svg to webp', 'convert svg to webp', 'vector to webp online', 'lightweight webp from svg'],
    icon: 'WEBP',
    category: 'Web & Dev',
    features: ['Up to 80% smaller file sizes than PNG', 'Full 32-bit alpha transparency', 'Improves Google Core Web Vitals & LCP'],
    pt: {
      title: 'Converta SVG para WebP para um site mais rápido',
      h1: 'Conversor de SVG para WebP moderno',
      highlight: 'WebP moderno',
      description: 'Converta gráficos vetoriais SVG complexos em imagens raster WebP modernas e leves, com transparência alfa total e máxima compressão para o Core Web Vitals do Google.',
      features: ['Arquivos até 80% menores que PNG', 'Transparência alfa de 32 bits', 'Melhora o Core Web Vitals e o LCP do Google'],
    },
  },
  {
    slug: 'convert-illustrator-svg-to-png',
    title: 'Convert Adobe Illustrator SVG to Transparent PNG',
    h1: 'Adobe Illustrator SVG to PNG Converter',
    highlight: 'SVG to PNG',
    description: 'Clean up bloated Adobe Illustrator SVG exports, strip Illustrator XML doctypes and namespaces, and render pixel-perfect high-resolution PNG images instantly.',
    keywords: ['illustrator svg to png', 'adobe illustrator export svg to png', 'clean illustrator svg', 'ai svg rasterizer'],
    icon: 'ILLUSTRATOR',
    category: 'Design Tools',
    features: ['Cleans Adobe Illustrator XML junk', 'Accurate gradient & layer blending', 'High-res export up to 16x scale (max 4000px per side)'],
    pt: {
      title: 'Converta SVG do Adobe Illustrator para PNG transparente',
      h1: 'Conversor de SVG do Adobe Illustrator para PNG',
      highlight: 'PNG transparente',
      description: 'Limpe exportações SVG volumosas do Adobe Illustrator, remova DOCTYPEs e namespaces do Illustrator e renderize imagens PNG em alta resolução e perfeitas em pixels instantaneamente.',
      features: ['Remove o lixo XML do Adobe Illustrator', 'Mesclagem precisa de gradientes e camadas', 'Exportação em alta resolução com escala até 16x (máx. 4000px por lado)'],
    },
  },
  {
    slug: 'convert-png-to-svg-vector-logo',
    title: 'Convert PNG Logo to Scalable SVG Vector Online',
    h1: 'PNG Logo to SVG Vector Converter',
    highlight: 'PNG Logo to SVG Vector',
    description: 'Trace bitmap logos, sketches, and graphics into infinitely scalable SVG vector paths with multi-color quantization, curve smoothing, and zero loss of quality.',
    keywords: ['png logo to svg', 'trace bitmap to vector', 'convert logo to vector svg', 'raster to vector converter'],
    icon: 'VECTOR',
    category: 'Conversion',
    features: ['Multi-color vector tracing', 'Corner smoothing & curve tuning', 'Infinitely scalable vector output'],
    pt: {
      title: 'Converta logotipos PNG para SVG vetorial escalonável online',
      h1: 'Conversor de logotipo PNG para SVG vetorial',
      highlight: 'SVG vetorial',
      description: 'Trace logotipos bitmap, esboços e gráficos em caminhos vetoriais SVG infinitamente escalonáveis, com quantização multicor, suavização de curvas e zero perda de qualidade.',
      features: ['Trace vetorial multicor', 'Suavização de cantos e ajuste de curvas', 'Saída vetorial infinitamente escalonável'],
    },
  },
  {
    slug: 'remove-background-from-product-photos',
    title: 'Remove Background from E-Commerce Product Photos',
    h1: 'AI Background Remover for Product Photos',
    description: 'Create clean, studio-grade transparent PNG product cutouts for Amazon, Shopify, eBay, and Etsy store listings instantly with AI browser segmentation.',
    keywords: ['product photo background remover', 'transparent png for amazon', 'shopify product background removal', 'white background to transparent'],
    icon: 'BGREMOVE',
    category: 'Conversion',
    features: ['Instant browser-side AI segmentation', 'Clean edge feathering & transparency', 'Ready for Amazon, Shopify & Etsy'],
    pt: {
      title: 'Remova o fundo de fotos de produtos para e-commerce',
      h1: 'Removedor de fundo com IA para fotos de produtos',
      highlight: 'fotos de produtos',
      description: 'Crie recortes de produtos transparentes de qualidade estúdio para Amazon, Shopify, eBay e Etsy instantaneamente, com segmentação por IA no navegador.',
      features: ['Segmentação instantânea por IA no navegador', 'Bordas suaves e transparência limpa', 'Pronto para Amazon, Shopify e Etsy'],
    },
  },
  {
    slug: 'svg-to-png-for-wordpress',
    title: 'Convert SVG to PNG for WordPress Sites & Themes',
    h1: 'SVG to PNG Converter for WordPress',
    description: 'Bypass WordPress SVG upload security blocks by converting vector logos, icons, and hero illustrations into safe, high-speed, retina-ready PNG assets.',
    keywords: ['wordpress svg to png', 'elementor svg upload fix', 'wordpress logo png', 'convert vector for wordpress'],
    icon: 'WORDPRESS',
    category: 'Web & Dev',
    features: ['100% compatible with all WordPress themes', 'No insecure SVG plugin required', 'Retina display sharpness'],
    pt: {
      title: 'Converta SVG para PNG para sites e temas do WordPress',
      h1: 'Conversor de SVG para PNG para WordPress',
      highlight: 'WordPress',
      description: 'Contorne os bloqueios de segurança de upload do WordPress convertendo logotipos, ícones e ilustrações vetoriais em PNGs seguros, rápidos e prontos para telas retina.',
      features: ['100% compatível com todos os temas do WordPress', 'Não requer plugin inseguro de SVG', 'Nitidez para telas retina'],
    },
  },
  {
    slug: 'svg-to-png-for-shopify',
    title: 'Convert SVG to PNG for Shopify Stores & Headers',
    h1: 'SVG to PNG Converter for Shopify',
    description: 'Prepare crystal-clear logos, payment badges, trust seals, and product badges for Shopify theme headers, footers, checkout pages, and mobile displays.',
    keywords: ['shopify svg to png', 'shopify trust badges png', 'shopify logo vector to png', 'shopify theme image converter'],
    icon: 'SHOPIFY',
    category: 'Web & Dev',
    features: ['Optimized for Shopify theme headers & badges', 'Crisp display on mobile screens', 'Transparent background preservation'],
    pt: {
      title: 'Converta SVG para PNG para lojas e cabeçalhos do Shopify',
      h1: 'Conversor de SVG para PNG para Shopify',
      highlight: 'Shopify',
      description: 'Prepare logotipos cristalinos, selos de pagamento, certificados de confiança e selos de produto para cabeçalhos de tema, rodapés, páginas de checkout e telas móveis do Shopify.',
      features: ['Otimizado para cabeçalhos e selos de temas Shopify', 'Exibição nítida em telas móveis', 'Preservação do fundo transparente'],
    },
  },
  {
    slug: 'svg-optimizer-for-web-performance',
    title: 'Optimize & Minify SVG Files for Core Web Vitals',
    h1: 'SVG Optimizer for Website Speed & Core Web Vitals',
    description: 'Compress bloated SVG code, strip editor metadata, clean empty tags, and round coordinate precision to boost PageSpeed Insights scores and LCP performance.',
    keywords: ['svg optimizer', 'minify svg for pagespeed', 'reduce svg file size', 'svg compression for web performance'],
    icon: 'OPTIMIZE',
    category: 'Web & Dev',
    features: ['Lossless vector code compression', 'Improves LCP and INP performance', 'Instant in-browser processing with zero lag'],
    pt: {
      title: 'Otimize e reduza arquivos SVG para o Core Web Vitals',
      h1: 'Otimizador de SVG para velocidade e Core Web Vitals',
      highlight: 'Core Web Vitals',
      description: 'Comprima código SVG volumoso, remova metadados de editores, limpe tags vazias e arredonde a precisão de coordenadas para melhorar o PageSpeed Insights e o LCP.',
      features: ['Compressão sem perda do código vetorial', 'Melhora o desempenho de LCP e INP', 'Processamento instantâneo no navegador, sem travamentos'],
    },
  },
  {
    slug: 'svg-to-png-for-notion-and-obsidian',
    title: 'Convert SVG to PNG for Notion & Obsidian Notes',
    h1: 'SVG to PNG Converter for Notion & Obsidian',
    description: 'Render custom vector icons, architecture diagrams, and mind maps into sharp transparent PNGs for Notion workspaces, Obsidian notes, and personal wikis.',
    keywords: ['notion svg to png', 'obsidian vector icon png', 'diagram svg to png', 'notion workspace icon converter'],
    icon: 'NOTION',
    category: 'Design Tools',
    features: ['Perfect for Notion page icons & covers', 'Supports dark and light mode notes', 'High-res diagram rasterization'],
    pt: {
      title: 'Converta SVG para PNG para notas no Notion e Obsidian',
      h1: 'Conversor de SVG para PNG para Notion e Obsidian',
      highlight: 'Notion e Obsidian',
      description: 'Renderize ícones vetoriais personalizados, diagramas de arquitetura e mapas mentais em PNGs transparentes e nítidos para workspaces do Notion, notas do Obsidian e wikis pessoais.',
      features: ['Perfeito para ícones e capas de páginas do Notion', 'Suporta notas em modo claro e escuro', 'Rasterização de diagramas em alta resolução'],
    },
  }
];

export const useCaseCategories: string[] = [...new Set(useCases.map((uc) => uc.category))];

export function getUseCaseBySlug(slug: string, locale?: string): UseCase | undefined {
  const uc = useCases.find((u) => u.slug === slug);
  if (!uc) return undefined;
  if (locale !== "pt" || !uc.pt) return uc;
  return { ...uc, ...uc.pt };
}

export function getLocalizedUseCases(locale?: string): UseCase[] {
  if (locale !== "pt") return useCases;
  return useCases.map((uc) => (uc.pt ? { ...uc, ...uc.pt } : uc));
}
