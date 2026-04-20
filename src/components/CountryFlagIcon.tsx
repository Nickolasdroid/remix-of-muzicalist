import type { SVGProps } from "react";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { getCountryCode, getCountryName } from "@/lib/countryFlags";

type FlagIconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

interface CountryFlagIconProps {
  country: string | null | undefined;
  className?: string;
}

const flagIconsMap = FlagIcons as unknown as Record<string, FlagIconComponent>;

const CountryFlagIcon = ({ country, className = "h-5 w-7 flex-shrink-0 rounded-sm shadow-sm" }: CountryFlagIconProps) => {
  const code = getCountryCode(country);
  const countryName = getCountryName(country);

  if (!code) return null;

  const FlagIcon = flagIconsMap[code];

  if (!FlagIcon) return null;

  return (
    <span className="inline-flex flex-shrink-0" title={countryName} aria-label={countryName}>
      <FlagIcon className={className} />
    </span>
  );
};

export default CountryFlagIcon;
