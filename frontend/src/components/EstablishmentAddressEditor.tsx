import { useState } from "react";
import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiErrors";
import type { Coordinates } from "../utils/geolocation";
import CoordinatePicker from "./CoordinatePicker";

export interface EstablishmentAddress {
  id?: string;
  endereco_texto?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
interface Props {
  address?: EstablishmentAddress | null;
  legacyLabel: string;
  onSaved: (address: EstablishmentAddress) => void;
}

export default function EstablishmentAddressEditor({ address, legacyLabel, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const addressLabel = address?.endereco_texto || [address?.logradouro, address?.numero, address?.complemento, address?.bairro, address?.cidade, address?.uf].filter(Boolean).join(", ") || legacyLabel;
  const start = () => {
    setText(addressLabel);
    setCoordinates(address?.latitude != null && address?.longitude != null ? { latitude: address.latitude, longitude: address.longitude } : null);
    setError(null);
    setSaved(false);
    setEditing(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) { setError("Informe o endereço completo do estabelecimento."); return; }
    setSaving(true);
    setError(null);
    // Preserve structured fields only when the address itself is unchanged.
    const original = text.trim() === addressLabel.trim() ? address : null;
    const payload = {
      endereco_texto: text.trim(),
      cep: original?.cep ?? null, logradouro: original?.logradouro ?? null,
      numero: original?.numero ?? null, complemento: original?.complemento ?? null,
      bairro: original?.bairro ?? null, cidade: original?.cidade ?? null, uf: original?.uf ?? null,
      latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null,
    };
    try {
      const response = await api.patch<EstablishmentAddress>("/v1/estabelecimentos/me/endereco", payload);
      onSaved(response.data);
      setEditing(false);
      setSaved(true);
    } catch (err) { setError(getApiErrorMessage(err, "Não foi possível salvar o endereço.")); }
    finally { setSaving(false); }
  };
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">Endereço do estabelecimento</h3>
      {!editing ? <>
        <p className="text-sm text-slate-600">{addressLabel || "Endereço não informado"}</p>
        <p className="text-sm text-slate-600">{address?.latitude != null && address?.longitude != null ? "Posição cadastrada para busca por proximidade." : "Confirme a posição do endereço para aparecer nas buscas por proximidade."}</p>
        <button type="button" onClick={start} className="rounded-lg border px-3 py-2 text-sm">Editar endereço e posição</button>
      </> : <form onSubmit={save} className="space-y-3">
        <label className="block text-sm">Endereço completo
          <textarea required disabled={saving} value={text} onChange={(event) => { setText(event.target.value); setCoordinates(null); }} className="mt-1 block w-full rounded-lg border p-2" placeholder="Rua, número, complemento, bairro, cidade e estado" />
        </label>
        <fieldset disabled={saving}>
          <CoordinatePicker addressText={text} value={coordinates} onChange={setCoordinates} />
        </fieldset>
        {!coordinates && <p className="text-sm text-amber-800">Você pode salvar o endereço sem posição. Nesse caso, ele aparecerá apenas na listagem geral.</p>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white">{saving ? "Salvando..." : "Salvar endereço"}</button>
          <button type="button" disabled={saving} onClick={() => setEditing(false)} className="text-sm underline">Cancelar</button>
        </div>
      </form>}
      {saved && <p role="status" className="text-sm text-emerald-800">Endereço atualizado.</p>}
    </section>
  );
}
