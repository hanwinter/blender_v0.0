from pathlib import Path

from sqlalchemy import Engine, inspect, text
from sqlalchemy.orm import Session

from app.database.session import Base
from app.models.model import ModelAsset, ModelPart
from app.schemas.model import ModelSeed

seed_directory = Path(__file__).resolve().parents[3] / "metadata"


def initialize_database(engine: Engine) -> None:
    if engine.dialect.name == "sqlite" and engine.url.database not in (None, "", ":memory:"):
        Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
    # Add only the new version column to pre-V0.2 SQLite databases, retaining saved data.
    inspector = inspect(engine)
    if engine.dialect.name == "sqlite" and inspector.has_table("model_assets"):
        if "version" not in {column["name"] for column in inspector.get_columns("model_assets")}:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE model_assets ADD COLUMN version VARCHAR(32) NOT NULL DEFAULT '1.0.0'"))
    Base.metadata.create_all(engine)
    with Session(engine) as session, session.begin():
        for path in sorted(seed_directory.glob("*.json")):
            seed = ModelSeed.model_validate_json(path.read_text(encoding="utf-8"))
            if len({part.id for part in seed.parts}) != len(seed.parts):
                raise ValueError(f"Duplicate part IDs in {path.name}")
            if session.get(ModelAsset, seed.id) is not None:
                continue
            model = ModelAsset(
                id=seed.id, version=seed.version, name=seed.name,
                description=seed.description, model_url=seed.model_url,
            )
            model.parts = [
                ModelPart(id=part.id, name=part.name, description=part.description, sort_order=index)
                for index, part in enumerate(seed.parts)
            ]
            session.add(model)
