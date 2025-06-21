from sqlalchemy.orm import Session, joinedload
from models import prompt as models
from models import user as user_models
from schemas import prompt as schemas

from sqlalchemy.orm import Session, joinedload
from models import prompt as models
from models import user as user_models
from schemas import prompt as schemas

def get_prompt_by_title_and_character(db: Session, title: str, character_id: str):
    return db.query(models.Prompt).filter(
        models.Prompt.title == title,
        models.Prompt.character_id == character_id
    ).first()

def get_prompts(db: Session, skip: int = 0, limit: int = 20, character_id: str = None):
    query = db.query(models.Prompt).options(
        joinedload(models.Prompt.creator),
        joinedload(models.Prompt.versions)
    ).filter(
        models.Prompt.versions.any(models.PromptVersion.status == models.PromptStatus.APPROVED)
    )

    if character_id:
        query = query.filter(models.Prompt.character_id == character_id)
        
    return query.order_by(models.Prompt.updated_at.desc()).offset(skip).limit(limit).all()

def get_user_prompts(db: Session, user_id: int):
     return db.query(models.Prompt).options(
        joinedload(models.Prompt.creator),
        joinedload(models.Prompt.versions)
    ).filter(models.Prompt.creator_id == user_id).order_by(models.Prompt.updated_at.desc()).all()


def get_prompt(db: Session, prompt_id: int):
    return db.query(models.Prompt).options(
        joinedload(models.Prompt.creator),
        joinedload(models.Prompt.versions)
    ).filter(models.Prompt.id == prompt_id).first()



def create_prompt_with_version(db: Session, prompt: schemas.PromptCreate, version: schemas.PromptVersionCreate, user_id: int, file_path: str):
    # Create Prompt
    db_prompt = models.Prompt(**prompt.model_dump(), creator_id=user_id)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    
    # Create first Version
    db_version = models.PromptVersion(
        **version.model_dump(),
        prompt_id=db_prompt.id,
        file_path=file_path,
        status=models.PromptStatus.PENDING # Явно указываем статус
    )
    db.add(db_version)
    
    # Create Publication Request
    # Связываем его с версией
    db_request = models.PublicationRequest(
        prompt_version=db_version,
        requester_id=user_id
    )
    db.add(db_request)
    
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def create_prompt_version(db: Session, prompt: models.Prompt, version: schemas.PromptVersionCreate, user_id: int, file_path: str):
    # Create new version
    db_version = models.PromptVersion(
        **version.model_dump(),
        prompt_id=prompt.id,
        file_path=file_path,
        status=models.PromptStatus.PENDING # Явно указываем статус
    )
    db.add(db_version)

    # Update prompt's updated_at timestamp
    prompt.updated_at = db_version.created_at
    db.add(prompt)
    
    # Create Publication Request
    db_request = models.PublicationRequest(
        prompt_version=db_version,
        requester_id=user_id
    )
    db.add(db_request)
    
    db.commit()
    db.refresh(db_version)
    return db_version

# +++ НОВЫЕ CRUD-ФУНКЦИИ ДЛЯ АДМИНИСТРИРОВАНИЯ +++

def get_pending_requests(db: Session, skip: int = 0, limit: int = 100):
    """Получает список заявок в статусе PENDING."""
    return db.query(models.PublicationRequest).options(
        joinedload(models.PublicationRequest.requester),
        joinedload(models.PublicationRequest.prompt_version).joinedload(models.PromptVersion.prompt)
    ).filter(
        models.PublicationRequest.status == models.PromptStatus.PENDING
    ).order_by(models.PublicationRequest.created_at.asc()).offset(skip).limit(limit).all()

def get_publication_request(db: Session, request_id: int):
    """Получает одну заявку по ID."""
    return db.query(models.PublicationRequest).filter(models.PublicationRequest.id == request_id).first()

def approve_request(db: Session, request: models.PublicationRequest) -> models.PublicationRequest:
    """Одобряет заявку и связанную с ней версию промпта."""
    request.status = models.PromptStatus.APPROVED
    request.prompt_version.status = models.PromptStatus.APPROVED
    # Обновляем `updated_at` у основного промпта, чтобы он поднялся в списке
    request.prompt_version.prompt.updated_at = request.prompt_version.created_at
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def reject_request(db: Session, request: models.PublicationRequest) -> models.PublicationRequest:
    """Отклоняет заявку и связанную с ней версию промпта."""
    request.status = models.PromptStatus.REJECTED
    request.prompt_version.status = models.PromptStatus.REJECTED
    db.add(request)
    db.commit()
    db.refresh(request)
    return request