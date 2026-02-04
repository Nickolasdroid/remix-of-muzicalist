import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const ExpandableText = ({ text, maxLength = 200, className }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.slice(0, maxLength).trimEnd() 
    : text;

  return (
    <p className={cn("text-foreground whitespace-pre-wrap", className)}>
      {displayText}
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
