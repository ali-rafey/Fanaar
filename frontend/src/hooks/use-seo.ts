import { useEffect } from "react";

export interface SEOProps {
  title: string;
  description?: string;
  canonicalPath?: string; // e.g. "/about"
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

const SITE_NAME = "Fanaar";
const SITE_URL = "https://fanaar.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/AA.png`;
const MANAGED_ATTR = "data-fanaar-seo";

const setMeta = (
  selector: string,
  attrName: "name" | "property",
  attrValue: string,
  content: string,
) => {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    el.setAttribute(MANAGED_ATTR, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    el.setAttribute(MANAGED_ATTR, "1");
    document.head.appendChild(el);
  }
  el.href = href;
};

export function useSEO({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  noIndex = false,
}: SEOProps): void {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const canonical = canonicalPath
      ? `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`
      : SITE_URL;
    const img = image || DEFAULT_IMAGE;

    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }

    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", img);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", img);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
    );

    setLink("canonical", canonical);
  }, [title, description, canonicalPath, image, type, noIndex]);
}
