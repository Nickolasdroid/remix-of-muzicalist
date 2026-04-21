import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface PasswordRequirement {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

export const getPasswordRequirements = (t: (k: string, d?: string) => string): PasswordRequirement[] => [
  { key: "length", label: t("passwordStrength.length", "At least 8 characters"), test: (p) => p.length >= 8 },
  { key: "uppercase", label: t("passwordStrength.uppercase", "One uppercase letter"), test: (p) => /[A-Z]/.test(p) },
  { key: "lowercase", label: t("passwordStrength.lowercase", "One lowercase letter"), test: (p) => /[a-z]/.test(p) },
  { key: "number", label: t("passwordStrength.number", "One number"), test: (p) => /\d/.test(p) },
  { key: "special", label: t("passwordStrength.special", "One special character (!@#$%...)"), test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const getPasswordScore = (password: string) => {
  const reqs = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return reqs.filter(Boolean).length;
};

interface Props {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator = ({ password, className }: Props) => {
  const { t } = useTranslation();
  const requirements = getPasswordRequirements(t);

  if (!password) return null;

  const score = getPasswordScore(password);
  const strengthLabel =
    score <= 2 ? t("passwordStrength.weak", "Weak")
    : score === 3 ? t("passwordStrength.fair", "Fair")
    : score === 4 ? t("passwordStrength.good", "Good")
    : t("passwordStrength.strong", "Strong");

  const strengthColor =
    score <= 2 ? "bg-destructive"
    : score === 3 ? "bg-yellow-500"
    : score === 4 ? "bg-blue-500"
    : "bg-green-500";

  const strengthTextColor =
    score <= 2 ? "text-destructive"
    : score === 3 ? "text-yellow-500"
    : score === 4 ? "text-blue-500"
    : "text-green-500";

  return (
    <div className={cn("space-y-2 mt-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strengthColor)}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={cn("text-xs font-medium", strengthTextColor)}>{strengthLabel}</span>
      </div>
      <ul className="space-y-1">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <li key={req.key} className="flex items-center gap-1.5 text-xs">
              {passed ? (
                <Check className="h-3 w-3 text-green-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className={passed ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
