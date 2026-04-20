import * as FlagIcons from "country-flag-icons/react/3x2";
import { getCountryCode, getCountryName } from "@/lib/countryFlags";

type FlagIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface CountryFlagIconProps {
  country: string | null | undefined;
  className?: string;
}

const flagIconsMap = FlagIcons as Record<string, FlagIconComponent>;

const CountryFlagIcon = ({ country, className = "h-5 w-7" }: CountryFlagIconProps) => {
  const code = getCountryCode(country);
  const countryName = getCountryName(country);

  if (!code) {
    return null;
  }

  const FlagIcon = flagIconsMap[code];

  if (!FlagIcon) {
    return null;
  }

  return <FlagIcon className={className} aria-label={countryName} title={countryName} />;
};

export default CountryFlagIcon;
