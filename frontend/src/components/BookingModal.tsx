import { BookingForm, type BookingEstablishment } from "./BookingForm";

export type { BookingEstablishment };

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
  if (!isOpen || !establishment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
