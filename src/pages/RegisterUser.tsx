import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Email/password user registration is deprecated.
// New signups must use Google via /register.
const RegisterUser = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/register", { replace: true });
  }, [navigate]);
  return null;
};

export default RegisterUser;
