import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

/**
 * Shared brand header for all auth pages (login, register, register/user,
 * register/artist, and artist registration steps). Keeps top-left position,
 * size, spacing, and styling identical across pages.
 */
const AuthHeader = () => {
  return (
    <div className="h-16 flex items-center px-4 md:px-8">
      <Link to="/" className="flex items-center gap-2">
        <img
          src={logo}
          alt="Muzicalist"
          className="h-8 w-8 md:h-9 md:w-9 object-contain"
        />
        <span
          className="font-bold text-foreground md:text-lg uppercase"
          style={{ fontFamily: "Montserrat, sans-serif", letterSpacing: "-0.02em" }}
        >
          Muzicalist
        </span>
      </Link>
    </div>
  );
};

export default AuthHeader;
