import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * A mention resolved from the authoritative database relationship
 * (e.g. `post_mentions`). The text is only used to locate where the
 * mention appears — the profile reference always comes from the DB.
 */
export interface TextMention {
  profileId: string;
  /** Display name of the mentioned profile (never translated) */
  name: string;
  /** Optional profile slug used for the public profile URL */
  slug?: string | null;
}

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  /** Real mentions attached to this content. Empty/undefined = plain text. */
  mentions?: TextMention[];
}

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/gi;

/** "https://www.youtu.be/3Xq_x?is=abc" -> "youtu.be/3Xq_x" (short, readable, max 32 chars) */
export const shortUrlLabel = (url: string): string => {
  let label = url;
  try {
    const u = new URL(url);
    label = u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    label = url.replace(/^https?:\/\//i, "").replace(/^www\./, "").split(/[?#]/)[0];
  }
  label = label.replace(/\/$/, "");
  return label.length > 32 ? `${label.slice(0, 31)}…` : label;
};

/** Plain text with links shown short and clickable. */
const renderWithLinks = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(URL_PATTERN)) {
    const start = m.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(
      <a
        key={`${keyPrefix}-link-${key++}`}
        href={m[0]}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        onClick={(e) => e.stopPropagation()}
        title={m[0]}
        className="text-accent hover:underline"
      >
        {shortUrlLabel(m[0])}
      </a>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

/**
 * Splits `text` into plain segments and clickable mention links.
 * Purely presentational: a mention is rendered only when the DB says the
 * profile is mentioned AND the `@Name` token exists in the text.
 */
const renderWithMentions = (text: string, mentions?: TextMention[]): ReactNode => {
  if (!mentions?.length) return renderWithLinks(text, "t");

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Longest names first so "@Ana Maria" wins over "@Ana".
  const sorted = [...mentions].filter((m) => m.name).sort((a, b) => b.name.length - a.name.length);
  if (!sorted.length) return renderWithLinks(text, "t");

  const pattern = new RegExp(`@(${sorted.map((m) => escape(m.name)).join("|")})`, "g");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    const mention = sorted.find((m) => m.name === match![1]);
    if (!mention) continue;
    if (match.index > lastIndex) nodes.push(...renderWithLinks(text.slice(lastIndex, match.index), `s${key}`));
    nodes.push(
      <Link
        key={`mention-${key++}`}
        to={`/artist/${mention.slug || mention.profileId}`}
        onClick={(e) => e.stopPropagation()}
        className="text-accent hover:underline"
      >
        @{mention.name}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (!nodes.length) return renderWithLinks(text, "t");
  if (lastIndex < text.length) nodes.push(...renderWithLinks(text.slice(lastIndex), "end"));
  return nodes;
};

const ExpandableText = ({ text, maxLength = 125, className, mentions }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Links count by their short label, and a cut never falls inside a link
  let visibleLength = text.length;
  let cut = maxLength;
  for (const m of text.matchAll(URL_PATTERN)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    visibleLength -= m[0].length - shortUrlLabel(m[0]).length;
    if (start < cut && end > cut) cut = end;
  }
  const shouldTruncate = visibleLength > maxLength && cut < text.length;
  const displayText = shouldTruncate && !isExpanded
    ? text.slice(0, cut).trimEnd()
    : text;

  return (
    <p
      className={cn("text-foreground whitespace-pre-wrap notranslate", className)}
      data-user-content="true"
      data-no-translate="true"
      translate="no"
    >
      {renderWithMentions(displayText, mentions)}
      {shouldTruncate && !isExpanded && (
        <>
          {"... "}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            more
          </button>
        </>
      )}
    </p>
  );
};

export default ExpandableText;
