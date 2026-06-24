import { forwardRef, SVGProps } from "react";

interface BandIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Custom icon in Lucide style: three silhouettes (band).
// Stroke uses currentColor, width 2, round caps/joins to match lucide-react icons.
const BandIcon = forwardRef<SVGSVGElement, BandIconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Back/center head */}
      <circle cx="12" cy="6" r="2.5" />
      {/* Left head */}
      <circle cx="5.5" cy="8.5" r="2" />
      {/* Right head */}
      <circle cx="18.5" cy="8.5" r="2" />
      {/* Center body */}
      <path d="M7.5 19v-3a4.5 4.5 0 0 1 9 0v3" />
      {/* Left body */}
      <path d="M2 20v-2a3.5 3.5 0 0 1 5.2-3" />
      {/* Right body */}
      <path d="M22 20v-2a3.5 3.5 0 0 0 -5.2-3" />
    </svg>
  )
);

BandIcon.displayName = "BandIcon";

export default BandIcon;
