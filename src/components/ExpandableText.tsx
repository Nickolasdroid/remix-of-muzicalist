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

/**
 * Splits `text` into plain segments and clickable mention links.
 * Purely presentational: a mention is rendered only when the DB says the
 * profile is mentioned AND the `@Name` token exists in the text.
 */
const renderWithMentions = (text: string, mentions?: TextMention[]): ReactNode => {
  if (!mentions?.length) return text;

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Longest names first so "@Ana Maria" wins over "@Ana".
  const sorted = [...mentions].filter((m) => m.name).sort((a, b) => b.name.length - a.name.length);
  if (!sorted.length) return text;

  const pattern = new RegExp(`@(${sorted.map((m) => escape(m.name)).join("|")})`, "g");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    const mention = sorted.find((m) => m.name === match![1]);
    if (!mention) continue;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
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

  if (!nodes.length) return text;
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

const ExpandableText = ({ text, maxLength = 125, className, mentions }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.slice(0, maxLength).trimEnd() 
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
