from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class ModelAsset(Base):
    __tablename__ = "model_assets"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    model_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    parts: Mapped[list["ModelPart"]] = relationship(
        back_populates="model", cascade="all, delete-orphan", order_by="ModelPart.sort_order"
    )


class ModelPart(Base):
    __tablename__ = "model_parts"

    model_id: Mapped[str] = mapped_column(ForeignKey("model_assets.id"), primary_key=True)
    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(default=0)
    model: Mapped[ModelAsset] = relationship(back_populates="parts")
