from pydantic import BaseModel, ConfigDict


class ModelInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str


class ModelSummary(ModelInfo):
    version: str
    model_url: str | None = None
    part_count: int


class ModelDetail(ModelSummary):
    parts: list[ModelInfo]


class ModelSeed(ModelInfo):
    version: str = "1.0.0"
    model_url: str | None = None
    parts: list[ModelInfo]
