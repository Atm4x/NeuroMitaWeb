# backend/schemas/prompt.py
from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict, computed_field

from models.prompt import PromptType, PromptStatus
from .user import User


# ---------------------------------------------------------------------------
#                     Базовые / Create-схемы
# ---------------------------------------------------------------------------

class PromptVersionBase(BaseModel):
    version_str: str
    notes: str | None = None
    tokens: int | None = None


class PromptVersionCreate(PromptVersionBase):
    """DTO, приходящая от клиента при загрузке версии"""
    pass


class PromptBase(BaseModel):
    title: str
    character_id: str
    type: PromptType
    description: str
    extended_description: str | None = None


class PromptCreate(PromptBase):
    """DTO, приходящая от клиента при создании промпта"""
    pass


# +++ НОВАЯ, УПРОЩЕННАЯ СХЕМА ДЛЯ СПИСКА +++
class PromptVersionInList(BaseModel):
    """Очень простая схема для отображения версии в карточке промпта."""
    version_str: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
#                     Схемы, возвращаемые наружу
# ---------------------------------------------------------------------------

class Prompt(PromptBase):
    id: int
    creator: User

    created_at: datetime = Field(..., alias="initial_upload")
    updated_at: datetime | None = Field(None, alias="last_updated")

    versions: list[PromptVersion] = []

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )


class PromptVersion(PromptVersionBase):
    id: int
    status: PromptStatus
    created_at: datetime
    prompt: PromptBase

    @computed_field(return_type=str | None)
    @property
    def download_url(self) -> str | None:
        """
        Generates a download URL relative to the API root.
        """
        if self.status == PromptStatus.APPROVED:
            return f"prompts/download/{self.id}"
        return f"admin/download/version/{self.id}"

    @computed_field(alias="date", return_type=datetime)
    def _date(self) -> datetime:
        return self.created_at

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

class PublicationRequestDetails(BaseModel):
    id: int
    status: PromptStatus
    created_at: datetime
    requester: User
    prompt_version: PromptVersion

    model_config = ConfigDict(from_attributes=True)


class PromptInList(BaseModel):
    """
    Упрощённая схема для публичного списка промптов.
    """
    id: int
    character_id: str
    type: PromptType
    title: str
    creator: str
    tokens: int | None
    description: str

    updated_at: datetime = Field(..., alias="last_updated")
    
    # +++ ИСПОЛЬЗУЕМ НОВУЮ УПРОЩЕННУЮ СХЕМУ +++
    versions: list[PromptVersionInList] = []

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

Prompt.model_rebuild()
PromptInList.model_rebuild()