from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import datetime

def criar_agendamento(
    refresh_token: str,
    client_id: str,
    client_secret: str,
    resumo: str,
    descricao: str,
    localizacao: str,
    data_inicio: datetime.datetime,
    duracao_minutos: int,
    email_cliente: str,
    email_estabelecimento: str
):
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token"
    )
    
    service = build('calendar', 'v3', credentials=creds)
    data_fim = data_inicio + datetime.timedelta(minutes=duracao_minutos)
    
    evento = {
        'summary': resumo,
        'description': descricao,
        'location': localizacao,
        'start': {
            'dateTime': data_inicio.isoformat(),
            'timeZone': 'America/Sao_Paulo',
        },
        'end': {
            'dateTime': data_fim.isoformat(),
            'timeZone': 'America/Sao_Paulo',
        },
        'attendees': [
            {'email': email_cliente},
            {'email': email_estabelecimento}
        ],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60},  # 1 dia antes
                {'method': 'popup', 'minutes': 10},       # 10 minutos antes
            ],
        },
    }
    
    evento_criado = service.events().insert(calendarId='primary', body=evento, sendUpdate='all').execute()
    
    return {
        'id': evento_criado['id'],
        'summary': evento_criado['summary'],
        'description': evento_criado['description'],
        'location': evento_criado['location'],
        'start': evento_criado['start'],
        'end': evento_criado['end'],
        'attendees': evento_criado['attendees']
    }