import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Form } from "./Form";

const MODAL_EXIT_DURATION_MS = 220;

interface EstablishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const EstablishmentModal = ({
  isOpen,
  onClose,
  onOpenLogin,
}: EstablishmentModalProps) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useBodyScrollLock(isRendered);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      return;
    }

    if (!isRendered) {
      return;
    }

    setIsClosing(true);

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
    }, MODAL_EXIT_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isRendered]);

  if (!isRendered) {
    return null;
  }

  return (
    <div
      className={`auth-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 ${
        isClosing ? "auth-modal-overlay-exit" : "auth-modal-overlay-enter"
      }`}
      onClick={onClose}
    >
      <div
        className={`auth-modal-panel flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ${
          isClosing ? "auth-modal-panel-exit" : "auth-modal-panel-enter"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between flex-row gap-4">
            <div>
              <div className="">
                <h2 className="text-lg font-semibold text-slate-900">
                  Cadastro de estabelecimento
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>Já tem cadastro?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Faça login
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="scrollbar-none overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <Form />
        </div>
      </div>
    </div>
  );
};
