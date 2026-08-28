interface Coordinates {
  latitude: number;
  longitude: number;
}

export class GeolocationUnsupportedError extends Error {}

const getCurrentPosition = (): Promise<Coordinates> => {
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
    zoom: "14",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error("Falha ao consultar o serviço de geolocalização.");
  }

  const data = (await response.json()) as {
    address?: Record<string, string>;
    display_name?: string;
  };

  const address = data.address;
  const neighborhood =
    address?.suburb ?? address?.neighbourhood ?? address?.quarter;
  const city =
    address?.city ?? address?.town ?? address?.village ?? address?.municipality;
  const state = address?.state;

  const parts = [neighborhood, city, state].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  if (data.display_name) {
    return data.display_name;
  }

  throw new Error("Não foi possível identificar o endereço.");
};

/** Resolves the user's current location as a human-readable string, falling back to raw coordinates. */
export const getCurrentLocationLabel = async (): Promise<string> => {
  const coords = await getCurrentPosition();

  try {
    return await reverseGeocode(coords);
  } catch {
    return formatCoordinates(coords);
  }
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
