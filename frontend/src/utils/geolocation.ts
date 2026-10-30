export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class GeolocationUnsupportedError extends Error {}

export const getCurrentPosition = (): Promise<Coordinates> => {
  if (!("geolocation" in navigator)) {
    return Promise.reject(
      new GeolocationUnsupportedError(
        "Seu navegador não suporta geolocalização.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
};

const formatCoordinates = ({ latitude, longitude }: Coordinates) =>
  `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

/** Best-effort reverse geocoding via Nominatim/OpenStreetMap; falls back to raw coordinates. */
const reverseGeocode = async (coords: Coordinates): Promise<string> => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(coords.latitude),
    lon: String(coords.longitude),
    zoom: "18",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) },
  );

  if (!response.ok) {
    throw new Error("Falha ao consultar o serviço de geolocalização.");
  }

  const data = (await response.json()) as {
    address?: Record<string, string>;
    display_name?: string;
  };

  const address = data.address;
  const street =
    address?.road ?? address?.pedestrian ?? address?.footway ?? address?.path;
  const neighborhood =
    address?.suburb ?? address?.neighbourhood ?? address?.quarter;
  const city =
    address?.city ?? address?.town ?? address?.village ?? address?.municipality;
  const state = address?.state;

  const parts = [street, neighborhood, city, state].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  if (data.display_name) {
    return data.display_name;
  }

  throw new Error("Não foi possível identificar o endereço.");
};

export interface CurrentLocation extends Coordinates {
  label: string;
}

export const getCurrentLocation = async (): Promise<CurrentLocation> => {
  const coords = await getCurrentPosition();
  let label = formatCoordinates(coords);
  try { label = await reverseGeocode(coords); } catch { /* Coordinates remain usable. */ }
  return { ...coords, label };
};

export const getCurrentLocationLabel = async (): Promise<string> =>
  (await getCurrentLocation()).label;

export interface AddressCandidate extends Coordinates {
  label: string;
}

/** Explicit user search; candidates must be selected, never accepted silently. */
export const searchAddressCoordinates = async (address: string): Promise<AddressCandidate[]> => {
  const params = new URLSearchParams({ format: "jsonv2", q: address, countrycodes: "br", limit: "5" });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Não foi possível consultar o endereço. Tente novamente.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Resposta de localização inválida.");
  return data.flatMap((item: { lat?: string; lon?: string; display_name?: string }) => {
    const latitude = Number(item.lat), longitude = Number(item.lon);
    return item.lat && item.lon && item.display_name && Number.isFinite(latitude) &&
      Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
      ? [{ latitude, longitude, label: item.display_name }] : [];
  });
};

export const getGeolocationErrorMessage = (error: unknown): string => {
  if (error instanceof GeolocationUnsupportedError) {
    return error.message;
  }

  if (
    typeof GeolocationPositionError !== "undefined" &&
    error instanceof GeolocationPositionError
  ) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Permissão de localização negada. Ative-a nas configurações do navegador ou preencha manualmente.";
    }
    if (error.code === error.TIMEOUT) {
      return "Tempo esgotado ao obter sua localização. Tente novamente.";
    }
    return "Não foi possível obter sua localização.";
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível obter sua localização.";
};

