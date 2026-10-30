"""Address projection and straight-line distance, independent of storage."""
from math import asin, cos, isfinite, radians, sin, sqrt

ADDRESS_COLUMNS = (
    "id,endereco_texto,cep,logradouro,numero,complemento,bairro,cidade,uf,"
    "latitude,longitude,atualizado_em"
)
ESTABLISHMENT_SELECT = (
    "*,endereco:enderecos!enderecos_estabelecimento_id_fkey(" + ADDRESS_COLUMNS + ")"
)


def project_address(row):
    # Unique estabelecimento_id makes this a one-to-one relation in PostgREST.
    result = dict(row)
    address = result.get("endereco")
    if isinstance(address, list):
        address = address[0] if address else None
    result["endereco"] = address
    if address:
        label = address.get("endereco_texto") or ", ".join(
            str(address[key]) for key in
            ("logradouro", "numero", "complemento", "bairro", "cidade", "uf")
            if address.get(key)
        )
        result["localizacao"] = label
    # Old coordinates in estabelecimentos are deliberately never consulted.
    return result


def distance_km(lat1, lon1, lat2, lon2):
    if not all(isfinite(x) for x in (lat1, lon1, lat2, lon2)):
        raise ValueError("Coordenadas devem ser finitas.")
    phi1, phi2 = radians(lat1), radians(lat2)
    a = sin(radians(lat2 - lat1) / 2) ** 2 + cos(phi1) * cos(phi2) * sin(radians(lon2 - lon1) / 2) ** 2
    return 6371.0088 * 2 * asin(sqrt(min(1.0, max(0.0, a))))


def nearby_establishments(rows, latitude=None, longitude=None, raio_km=None):
    results = []
    for row in rows:
        item = project_address(row)
        address = item.get("endereco") or {}
        lat, lon = address.get("latitude"), address.get("longitude")
        distance = None
        if latitude is not None and lat is not None and lon is not None:
            distance = distance_km(latitude, longitude, lat, lon)
        if raio_km is not None and (distance is None or distance > raio_km):
            continue
        item["distancia_km"] = distance
        results.append(item)
    if latitude is not None:
        results.sort(key=lambda item: (
            item["distancia_km"] is None,
            item["distancia_km"] if item["distancia_km"] is not None else float("inf"),
            str(item["id"]),
        ))
    return results
