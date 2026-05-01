import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Email/password artist registration is deprecated.
// New signups must use Google via /register.
const RegisterArtist = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/register", { replace: true });
  }, [navigate]);
  return null;
};

export default RegisterArtist;
