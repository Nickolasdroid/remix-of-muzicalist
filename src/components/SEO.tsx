import { Helmet } from "react-helmet-async";

const SITE_URL = "https://muzicalist.com";
const SITE_NAME = "Muzicalist";
const DEFAULT_TITLE = "Muzicalist | Discover & Book Professional Artists";
const DEFAULT_DESCRIPTION =
  "Discover singers, DJs, bands and instrumentalists. Compare profiles, reviews, media and book the perfect artist for your event.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  /** Page title. Rendered as-is; include the brand suffix yourself if desired. */
  title?: string;
  /** Meta description, ideally 120–160 characters. */
  description?: string;
  /** Path starting with "/" used to build the canonical URL (e.g. "/artist/123"). */
  path?: string;
  /** Absolute URL of the social sharing image. Falls back to the site default. */
  image?: string;
  /** Open Graph type. "profile" is useful for artist pages. */
  type?: "website" | "profile" | "article";
  /** Set true on pages that must not be indexed (dashboards, auth pages, etc.). */
  noindex?: boolean;
  /** One or more JSON-LD structured data objects. */
  jsonLd?: object | object[];
}

/**
 * Per-page SEO tags. Overrides the static defaults from index.html so every
 * route gets its own title, description, canonical URL and social preview.
 *
 * Usage:
 *   <SEO title="Artist Name — DJ | Muzicalist" description="..." path="/artist/123" />
 */
const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const canonical = `${SITE_URL}${path}`;
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

/** Builds a meta description from free text (e.g. an artist bio), trimmed to ~155 chars. */
export const toMetaDescription = (text: string | null | undefined, fallback: string): string => {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= 155) return clean;
  return `${clean.slice(0, 152).replace(/\s+\S*$/, "")}…`;
};

export default SEO;
