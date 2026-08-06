import { useEffect, useState } from "react";
import { ClientForm } from "./ClientForm";
import { LoginForm } from "./LoginForm";
import type { UserSession } from "../types/auth";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const MODAL_EXIT_DURATION_MS = 220;
const FORM_SWITCH_DURATION_MS = 230;

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
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isSwitchingForm, setIsSwitchingForm] = useState(false);
  const [enterMode, setEnterMode] = useState<"normal" | "switch">("normal");
  const [activeForm, setActiveForm] = useState<"login" | "register">("login");

  useBodyScrollLock(isRendered);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsModalClosing(false);
      setIsSwitchingForm(false);
      setEnterMode("normal");
      setActiveForm("login");
      return;
    }

    if (!isRendered) {
      return;
    }

    setIsModalClosing(true);

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false);
      setIsModalClosing(false);
      setIsSwitchingForm(false);
      setEnterMode("normal");
      setActiveForm("login");
    }, MODAL_EXIT_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isRendered]);

  if (!isRendered) {
    return null;
  }

  const switchForm = (nextForm: "login" | "register") => {
    if (isModalClosing || isSwitchingForm || activeForm === nextForm) {
      return;
    }

    setIsSwitchingForm(true);

    window.setTimeout(() => {
      setActiveForm(nextForm);
      setEnterMode("switch");
      setIsSwitchingForm(false);
    }, FORM_SWITCH_DURATION_MS);
  };

  return (
    <>
      {activeForm === "login" ? (
        <LoginForm
          isClosing={isModalClosing}
          isMorphingToRegister={isSwitchingForm && activeForm === "login"}
          disableEnterAnimation={enterMode === "switch"}
          onClose={() => {
            onClose();
          }}
          onLoginSuccess={(session) => {
            onAuthChange?.(session);
          }}
          onSwitchToRegister={() => {
            switchForm("register");
          }}
        />
      ) : null}

      {activeForm === "register" ? (
        <ClientForm
          isClosing={isModalClosing}
          isMorphingToLogin={isSwitchingForm && activeForm === "register"}
          disableEnterAnimation={enterMode === "switch"}
          onClose={() => {
            onClose();
          }}
          onLoginSuccess={(session) => {
            onAuthChange?.(session);
            onClose();
          }}
          onBackToLogin={() => {
            switchForm("login");
          }}
        />
      ) : null}
    </>
  );
};

export default AuthModal;
