/** @type {import('next').NextConfig} */

// 7 dias "fresco" + 30 dias servindo do cache enquanto revalida em segundo plano.
// Quem já visitou carrega instantaneamente; trocar uma foto se propaga sozinho em poucos dias.
const CACHE_IMAGENS = "public, max-age=604800, stale-while-revalidate=2592000"
// Ícones/favicons praticamente nunca mudam.
const CACHE_ICONES = "public, max-age=2592000, stale-while-revalidate=2592000"

const nextConfig = {
  // Fixa a raiz do projeto (evita o Next inferir a pasta de cima como workspace).
  turbopack: { root: import.meta.dirname },

  images: {
    // AVIF/WebP e redimensionamento automático por tamanho de tela.
    formats: ["image/avif", "image/webp"],
    // Larguras realmente usadas pelo site (evita gerar variações inúteis).
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600],
    imageSizes: [96, 192, 300, 420],
    // Resultado otimizado fica em cache por 31 dias.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // Imagens de presentes vindas do Supabase Storage.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: CACHE_IMAGENS }],
      },
      {
        source: "/:file(icon|icon-dark-32x32|icon-light-32x32|apple-icon)\\.:ext(png|svg)",
        headers: [{ key: "Cache-Control", value: CACHE_ICONES }],
      },
    ]
  },
}

export default nextConfig
