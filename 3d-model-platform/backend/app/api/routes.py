from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_session
from app.schemas.model import ModelDetail, ModelInfo, ModelSummary
from app.services.models import get_model, list_models

router = APIRouter(prefix="/api")
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/models", response_model=list[ModelSummary])
def models(session: DatabaseSession) -> list[ModelSummary]:
    return list_models(session)


@router.get("/models/{model_id}", response_model=ModelDetail)
def model_detail(model_id: str, session: DatabaseSession) -> ModelDetail:
    result = get_model(session, model_id)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "MODEL_NOT_FOUND", "message": "未找到模型。"})
    return result


@router.get("/models/{model_id}/parts", response_model=list[ModelInfo])
def model_parts(model_id: str, session: DatabaseSession) -> list[ModelInfo]:
    return model_detail(model_id, session).parts
