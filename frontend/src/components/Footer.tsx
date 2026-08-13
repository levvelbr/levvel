import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright © LevveL 2026</p>
        <address className="flex flex-wrap items-center gap-x-5 gap-y-2 not-italic">
          <a
            href="mailto:levvel@mail.com"
            className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-emerald-700"
          >
            <Mail className="h-4 w-4" strokeWidth={1.8} />
            levvel@mail.com
          </a>
          <a
            href="tel:+55999999999"
            className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-emerald-700"
          >
            <Phone className="h-4 w-4" strokeWidth={1.8} />
            (55) 9 9999-9999
          </a>
          <Link
            to="/contato"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Página de contato
          </Link>
        </address>
      </div>
    </footer>
  );
};

export default Footer;
