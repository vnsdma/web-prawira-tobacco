import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kategori/tobacco`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kategori/cigarettes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kategori/accessories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: products, error } = await supabase
      .from("products")
      .select("id, created_at")
      .gt("in_stock", 0)

    if (error) {
      console.error("Error fetching products for sitemap:", error)
      return staticRoutes
    }

    if (products && products.length > 0) {
      const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
        url: `${baseUrl}/produk/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      }))

      return [...staticRoutes, ...productUrls]
    }
  } catch (error) {
    console.error("Error generating product sitemap:", error)
  }

  return staticRoutes
}
