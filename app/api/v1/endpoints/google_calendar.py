from datetime import datetime, timedelta

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
]


def criar_agendamento(
    refresh_token: str,
    client_id: str,
    client_secret: str,
    resumo: str,
    descricao: str,
    localizacao: str,
    data_inicio: datetime,
    duracao_minutos: int,
    email_cliente: str,
) -> dict:
    if not refresh_token:
        raise ValueError("Refresh token do Google não informado.")

    if not email_cliente:
        raise ValueError("E-mail do cliente não informado.")

    if not isinstance(data_inicio, datetime):
        raise TypeError("data_inicio deve ser um objeto datetime.")

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES,
    )

    service = build(
        "calendar",
        "v3",
        credentials=creds,
        cache_discovery=False,
    )

    data_fim = data_inicio + timedelta(minutes=duracao_minutos)

    evento = {
        "summary": resumo,
        "description": descricao,
        "location": localizacao,
        "start": {
            "dateTime": data_inicio.isoformat(),
            "timeZone": "America/Sao_Paulo",
        },
        "end": {
            "dateTime": data_fim.isoformat(),
            "timeZone": "America/Sao_Paulo",
        },
        "attendees": [
            {
                "email": email_cliente,
            }
        ],
        "guestsCanInviteOthers": False,
        "guestsCanModify": False,
        "reminders": {
            "useDefault": False,
            "overrides": [
                {
                    "method": "email",
                    "minutes": 24 * 60,
                },
                {
                    "method": "popup",
                    "minutes": 10,
                },
            ],
        },
    }

    evento_criado = (
        service.events()
        .insert(
            calendarId="primary",
            body=evento,
            sendUpdates="all",
        )
        .execute()
    )

    return {
        "id": evento_criado["id"],
        "html_link": evento_criado.get("htmlLink"),
        "status": evento_criado.get("status"),
        "summary": evento_criado.get("summary"),
        "description": evento_criado.get("description"),
        "location": evento_criado.get("location"),
        "start": evento_criado.get("start"),
        "end": evento_criado.get("end"),
        "attendees": evento_criado.get("attendees", []),
    }