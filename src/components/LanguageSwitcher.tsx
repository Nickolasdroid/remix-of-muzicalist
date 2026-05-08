import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "default" | "ghost" | "outline";
  showLabel?: boolean;
  className?: string;
}

const LANGUAGES = [
  { code: "en", labelKey: "common.english", flag: "🇬🇧", short: "EN" },
  { code: "ro", labelKey: "common.romanian", flag: "🇷🇴", short: "RO" },
] as const;

const LanguageSwitcher = ({
  variant = "ghost",
  showLabel = false,
  className,
}: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ?? LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn("gap-1.5 px-2 h-8", className)}
          aria-label={t("common.language", "Language")}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{current.short}</span>
          {showLabel && <span className="text-xs">{t(current.labelKey)}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg min-w-[140px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={cn(
              "gap-2 cursor-pointer",
              current.code === lang.code && "bg-accent/20 text-accent"
            )}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{t(lang.labelKey)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
