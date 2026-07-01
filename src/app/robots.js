export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://robotiokit.com";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/checkout/"] },
    sitemap: `${base}/sitemap.xml`
  };
}
