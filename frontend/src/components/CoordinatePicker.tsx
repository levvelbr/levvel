import { useEffect, useRef, useState } from "react";
import { getCurrentPosition, getGeolocationErrorMessage, searchAddressCoordinates, type AddressCandidate, type Coordinates } from "../utils/geolocation";

interface Props {
  addressText: string;
  value: Coordinates | null;
  onChange: (value: Coordinates | null) => void;
}

export default function CoordinatePicker({ addressText, value, onChange }: Props) {
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const previousAddress = useRef(addressText);
  useEffect(() => {
    if (previousAddress.current !== addressText) {
      previousAddress.current = addressText;
      requestId.current += 1;
      setCandidates([]);
      setError(null);
      setBusy(false);
      onChange(null);
    }
  }, [addressText, onChange]);
  useEffect(() => () => { requestId.current += 1; }, []);

  const locate = async (useDevice: boolean) => {
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    setCandidates([]);
    try {
      if (useDevice) {
        const position = await getCurrentPosition();
        if (requestId.current === id) onChange(position);
      } else {
        const results = await searchAddressCoordinates(addressText);
        if (requestId.current !== id) return;
        setCandidates(results);
        if (!results.length) setError("Endereço não encontrado. Complete rua, número, cidade e estado e tente novamente.");
      }
    } catch (err) {
      if (requestId.current === id) setError(getGeolocationErrorMessage(err));
    } finally {
      if (requestId.current === id) setBusy(false);
    }
  };
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">Posição do estabelecimento</p>
      <p className="text-sm text-slate-600">Confirme a posição para aparecer nas buscas por proximidade. Use a posição atual somente se estiver no estabelecimento.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !addressText.trim()} onClick={() => void locate(false)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Localizar pelo endereço</button>
        <button type="button" disabled={busy} onClick={() => void locate(true)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Estou no local: usar minha posição</button>
      </div>
      {busy && <p role="status" className="text-sm">Consultando localização...</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {candidates.length > 0 && <div className="space-y-2">
        <p className="text-sm">Selecione o endereço correspondente:</p>
        {candidates.map((candidate, index) => <button key={index} type="button" className="block w-full rounded-lg border bg-white p-2 text-left text-sm" onClick={() => { onChange(candidate); setCandidates([]); }}>
          {candidate.label}
        </button>)}
      </div>}
      {value && <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-800">
        <span>Posição definida</span>
        <a href={`https://www.openstreetmap.org/?mlat=${value.latitude}&mlon=${value.longitude}#map=18/${value.latitude}/${value.longitude}`} target="_blank" rel="noopener noreferrer" className="underline">Conferir no mapa</a>
        <button type="button" onClick={() => onChange(null)} className="underline">Remover posição</button>
      </div>}
    </div>
  );
}
