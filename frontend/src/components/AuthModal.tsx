import { useEffect, useState } from "react";
import { ClientForm } from "./ClientForm";
import { LoginForm } from "./LoginForm";
import type { UserSession } from "../types/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange?: (session: UserSession | null) => void;
}

export const AuthModal = ({
  isOpen,
  onClose,
  onAuthChange,
}: AuthModalProps) => {
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(true);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoginFormOpen(true);
      setIsClientFormOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {isLoginFormOpen ? (
        <LoginForm
          onClose={() => {
            setIsLoginFormOpen(true);
            onClose();
          }}
          onLoginSuccess={(session) => {
            onAuthChange?.(session);
            setIsLoginFormOpen(false);
          }}
          onSwitchToRegister={() => {
            setIsLoginFormOpen(false);
            setIsClientFormOpen(true);
          }}
        />
      ) : null}

      {isClientFormOpen ? (
        <ClientForm
          onClose={() => {
            setIsClientFormOpen(false);
            onClose();
          }}
          onLoginSuccess={() => {
            setIsClientFormOpen(false);
            onClose();
          }}
          onBackToLogin={() => {
            setIsClientFormOpen(false);
            setIsLoginFormOpen(true);
          }}
        />
      ) : null}
    </>
  );
};

export default AuthModal;
