import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const fromState = (location.state as { from?: string } | null)?.from;
  const from =
    typeof fromState === "string" && fromState !== "/login"
      ? fromState
      : "/app";

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          navigate("/");
        }}
        onAuthChange={(session) => {
          if (session) {
            setIsOpen(false);
            navigate(from, { replace: true });
          }
        }}
      />
    </div>
  );
};
