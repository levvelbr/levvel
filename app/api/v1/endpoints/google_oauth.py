import requests
import logging

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from jose import JWTError, jwt
from app.core.config import settings, supabase_client
from app.core.security import get_usuario_logado

import os

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

logger = logging.getLogger(__name__)
router = APIRouter()



SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
]


def criar_flow_google(state: str | None = None) -> Flow:
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [
                settings.GOOGLE_REDIRECT_URI,
            ],
        }
    }

    flow = Flow.from_client_config(
        client_config=client_config,
        scopes=SCOPES,
        state=state,
        autogenerate_code_verifier=False,
        # code_verifier=None,  # Permite que o Google gere o code_verifier automaticamente
    )

    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

    return flow


def criar_oauth_state(estabelecimento_id: str) -> str:
    agora = datetime.now(timezone.utc)

    payload = {
        "sub": estabelecimento_id,
        "purpose": "google_calendar_oauth",
        "iat": agora,
        "exp": agora + timedelta(minutes=10),
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def validar_oauth_state(state: str) -> str:
    try:
        payload = jwt.decode(
            state,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado OAuth inválido ou expirado.",
        ) from error

    if payload.get("purpose") != "google_calendar_oauth":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado OAuth inválido.",
        )

    estabelecimento_id = payload.get("sub")

    if not estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estabelecimento não identificado no fluxo OAuth.",
        )

    return str(estabelecimento_id)


@router.get("/conectar")
async def conectar_google_calendar(
    usuario_atual: dict = Depends(get_usuario_logado),
):
    if usuario_atual.get("role") != "estabelecimento":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente estabelecimentos podem conectar o Google Calendar.",
        )

    estabelecimento_id = (usuario_atual.get("sub") or usuario_atual.get("id"))
    
    if not estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )
    
    estabelecimento_id = str(estabelecimento_id)

    oauth_state = criar_oauth_state(estabelecimento_id)

    flow = criar_flow_google(state=oauth_state)

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    return {
        "authorization_url": authorization_url,
    }


@router.get("/callback")
async def callback_google_calendar(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
):
    estabelecimento_id = validar_oauth_state(state)

    flow = criar_flow_google(state=state)

    try:
        authorization_response = str(request.url)

        flow.fetch_token(
            authorization_response=authorization_response
        )

    except Exception as error:
        logger.exception(
            "Erro ao obter credenciais do Google: %s",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não foi possível obter as credenciais "
                f"do Google: {error}"
            ),
        ) from error

    credentials = flow.credentials

    dados_google = {
        "google_calendar_conectado": True,
        "google_calendar_id": "primary",
    }

    if credentials.refresh_token:
        dados_google["google_refresh_token"] = (
            credentials.refresh_token
        )
    else:
        estabelecimento_atual = (
            supabase_client
            .table("estabelecimentos")
            .select("google_refresh_token")
            .eq("id", estabelecimento_id)
            .maybe_single()
            .execute()
        )

        token_existente = (
            estabelecimento_atual.data.get(
                "google_refresh_token"
            )
            if estabelecimento_atual.data
            else None
        )

        if not token_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "O Google não retornou um refresh token. "
                    "Revogue o acesso anterior e tente conectar novamente."
                ),
            )

    resposta = (
        supabase_client
        .table("estabelecimentos")
        .update(dados_google)
        .eq("id", estabelecimento_id)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estabelecimento não encontrado.",
        )

    return RedirectResponse(
        url=(
            f"{settings.FRONTEND_URL}"
            "?google_calendar=conectado"
        ),
        status_code=status.HTTP_302_FOUND,
    )