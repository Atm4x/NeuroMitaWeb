from sqlalchemy import Column, Integer, String, Boolean # +++
from sqlalchemy.orm import relationship
from db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_superuser = Column(Boolean(), default=False) # +++

    prompts = relationship("Prompt", back_populates="creator")
    requests = relationship("PublicationRequest", back_populates="requester")