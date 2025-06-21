import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base

class PromptStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PromptType(str, enum.Enum):
    LORE = "LORE"
    FAN = "FAN"

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    character_id = Column(String, index=True, nullable=False)
    type = Column(Enum(PromptType), nullable=False)
    description = Column(Text, nullable=False)
    extended_description = Column(Text, nullable=True)
    
    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="prompts")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan")
    
    __table_args__ = (UniqueConstraint('title', 'character_id', name='_title_character_uc'),)

class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_str = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    tokens = Column(Integer)
    status = Column(Enum(PromptStatus), default=PromptStatus.PENDING, nullable=False)
    
    prompt_id = Column(Integer, ForeignKey("prompts.id"))
    prompt = relationship("Prompt", back_populates="versions")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    publication_request = relationship("PublicationRequest", back_populates="prompt_version", uselist=False)

    __table_args__ = (UniqueConstraint('prompt_id', 'version_str', name='_prompt_version_uc'),)


class PublicationRequest(Base):
    __tablename__ = "publication_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(PromptStatus), default=PromptStatus.PENDING, nullable=False)

    prompt_version_id = Column(Integer, ForeignKey("prompt_versions.id"))
    prompt_version = relationship("PromptVersion", back_populates="publication_request")

    requester_id = Column(Integer, ForeignKey("users.id"))
    requester = relationship("User", back_populates="requests")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())