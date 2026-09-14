import { Contact } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Footer = () => {
  const { session } = useAuth();
  const isEstablishment = session?.role === "estabelecimento";

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright © LevveL 2026</p>
        <address className="flex flex-wrap items-center gap-x-5 gap-y-2 not-italic">
          <Link
            to="/contato"
            className={`flex gap-2 font-semibold ${isEstablishment ? "text-blue-700 hover:text-blue-800" : "text-emerald-700 hover:text-emerald-800"}`}
          >
            <Contact></Contact>
            Página de contato
          </Link>
        </address>
      </div>
    </footer>
  );
};

export default Footer;
