import { Form } from "./Form";

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
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
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
        </div>

        <div className="scrollbar-none overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <Form />
        </div>
      </div>
    </div>
  );
};
