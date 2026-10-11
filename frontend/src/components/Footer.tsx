import { Contact } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Footer = () => {
  const { session } = useAuth();
  const isEstablishment = session?.role === "estabelecimento";

  return (
    <footer className="border-t border-slate-200 bg-white px-3 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-row flex-nowrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
        <p className="whitespace-nowrap">Copyright © LevveL 2026</p>
        <address className="flex shrink-0 items-center not-italic">
          <Link
            to="/contato"
            className={`flex items-center gap-2 whitespace-nowrap font-semibold ${isEstablishment ? "text-blue-700 hover:text-blue-800" : "text-emerald-700 hover:text-emerald-800"}`}
          >
            <Contact className="h-4 w-4 sm:h-6 sm:w-6" />
            Página de contato
          </Link>
        </address>
      </div>
    </footer>
  );
};

export default Footer;
