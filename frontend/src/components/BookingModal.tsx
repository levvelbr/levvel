import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { BookingForm, type BookingEstablishment } from "./BookingForm";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export type { BookingEstablishment };

const MODAL_EXIT_DURATION_MS = 220;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: BookingEstablishment | null;
}

export const BookingModal = ({
  isOpen,
  onClose,
  establishment,
}: BookingModalProps) => {
  const [isRendered, setIsRendered] = useState(
    isOpen && Boolean(establishment),
  );
  const [isModalClosing, setIsModalClosing] = useState(false);

  useBodyScrollLock(isRendered);

  useEffect(() => {
    if (isOpen && establishment) {
      const timeoutId = window.setTimeout(() => {
        setIsRendered(true);
        setIsModalClosing(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!isRendered) {
      return;
    }

    const closeStartTimeoutId = window.setTimeout(() => {
      setIsModalClosing(true);
    }, 0);

    const closeTimeoutId = window.setTimeout(() => {
      setIsRendered(false);
      setIsModalClosing(false);
    }, MODAL_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(closeStartTimeoutId);
      window.clearTimeout(closeTimeoutId);
    };
  }, [establishment, isOpen, isRendered]);

  if (!isRendered || !establishment) return null;

  return (
    <div
      className={`auth-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm ${
        isModalClosing ? "auth-modal-overlay-exit" : "auth-modal-overlay-enter"
      }`}
      onClick={onClose}
    >
      <div
        className={`auth-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-xl ${
          isModalClosing ? "auth-modal-panel-exit" : "auth-modal-panel-enter"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Solicitar agendamento
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {establishment.nome_estabelecimento}
            </p>
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

        <div className="px-6 py-5">
          <BookingForm
            establishment={establishment}
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
