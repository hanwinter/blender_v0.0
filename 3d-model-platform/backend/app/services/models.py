from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.model import ModelAsset
from app.schemas.model import ModelDetail, ModelInfo, ModelSummary


def describe(model: ModelAsset) -> ModelSummary:
    return ModelSummary(
        id=model.id, version=model.version, name=model.name, description=model.description,
        model_url=model.model_url, part_count=len(model.parts),
    )


def list_models(session: Session) -> list[ModelSummary]:
    models = session.scalars(
        select(ModelAsset).options(selectinload(ModelAsset.parts)).order_by(ModelAsset.id)
    )
    return [describe(model) for model in models]


def get_model(session: Session, model_id: str) -> ModelDetail | None:
    model = session.scalar(
        select(ModelAsset).where(ModelAsset.id == model_id).options(selectinload(ModelAsset.parts))
    )
    if model is None:
        return None
    return ModelDetail(
        **describe(model).model_dump(),
        parts=[ModelInfo.model_validate(part) for part in model.parts],
    )
