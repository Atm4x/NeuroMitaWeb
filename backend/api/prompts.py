import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from models import user as user_models
from models import prompt as prompt_models
from schemas import prompt as prompt_schemas
from crud import crud_prompt
from . import deps

router = APIRouter()

MEDIA_ROOT = Path("media/prompts")
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=prompt_schemas.Prompt)
def create_prompt(
    *,
    db: Session = Depends(deps.get_db),
    current_user: user_models.User = Depends(deps.get_current_user),
    title: str = Form(...),
    character_id: str = Form(...),
    type: str = Form(...),
    description: str = Form(...),
    extended_description: str = Form(...),
    version_str: str = Form(...),
    notes: str = Form(...),
    tokens: int = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")

    if crud_prompt.get_prompt_by_title_and_character(db, title=title, character_id=character_id):
        raise HTTPException(status_code=400, detail="A prompt with this title for this character already exists.")

    file_name = f"{uuid.uuid4()}.zip"
    file_path = MEDIA_ROOT / file_name
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    prompt_in = prompt_schemas.PromptCreate(
        title=title, character_id=character_id, type=type,
        description=description, extended_description=extended_description
    )
    version_in = prompt_schemas.PromptVersionCreate(version_str=version_str, notes=notes, tokens=tokens)
    
    db_prompt = crud_prompt.create_prompt_with_version(
        db, prompt=prompt_in, version=version_in, user_id=current_user.id, file_path=str(file_path)
    )
    return db_prompt

@router.post("/{prompt_id}/versions", status_code=status.HTTP_201_CREATED, response_model=prompt_schemas.PromptVersion)
def create_new_version(
    prompt_id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: user_models.User = Depends(deps.get_current_user),
    version_str: str = Form(...),
    notes: str = Form(...),
    tokens: int = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")

    db_prompt = crud_prompt.get_prompt(db, prompt_id=prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    
    if db_prompt.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this prompt.")

    if any(v.version_str == version_str for v in db_prompt.versions):
        raise HTTPException(status_code=400, detail="This version already exists for this prompt.")

    file_name = f"{uuid.uuid4()}.zip"
    file_path = MEDIA_ROOT / file_name
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    version_in = prompt_schemas.PromptVersionCreate(version_str=version_str, notes=notes, tokens=tokens)
    
    db_version = crud_prompt.create_prompt_version(
        db, prompt=db_prompt, version=version_in, user_id=current_user.id, file_path=str(file_path)
    )
    return db_version


@router.get("", response_model=List[prompt_schemas.PromptInList])
def read_prompts(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    page_size: int = Query(20, gt=0, le=100),
    character_id: str | None = None
):
    skip = (page - 1) * page_size
    prompts = crud_prompt.get_prompts(db, skip=skip, limit=page_size, character_id=character_id)
    
    response_data = []
    for p in prompts:
        latest_approved_version = max(
            (v for v in p.versions if v.status == 'approved'), 
            key=lambda v: v.created_at, 
            default=None
        )
        if latest_approved_version:
            # +++ НАЧАЛО ИСПРАВЛЕНИЯ +++
            # Создаем экземпляр PromptInList, передавая ему простые значения.
            # Для поля versions мы создаем экземпляр новой, простой схемы PromptVersionInList.
            prompt_for_list = prompt_schemas.PromptInList(
                id=p.id,
                character_id=p.character_id,
                type=p.type,
                title=p.title,
                creator=p.creator.username,
                tokens=latest_approved_version.tokens,
                description=p.description,
                updated_at=latest_approved_version.created_at,
                versions=[
                    prompt_schemas.PromptVersionInList(version_str=latest_approved_version.version_str)
                ]
            )
            response_data.append(prompt_for_list)
            # +++ КОНЕЦ ИСПРАВЛЕНИЯ +++
            
    return response_data


@router.get("/me", response_model=List[prompt_schemas.Prompt])
def read_my_prompts(
    db: Session = Depends(deps.get_db),
    current_user: user_models.User = Depends(deps.get_current_user)
):
    return crud_prompt.get_user_prompts(db, user_id=current_user.id)


@router.get("/{prompt_id}", response_model=prompt_schemas.Prompt)
def read_prompt(prompt_id: int, db: Session = Depends(deps.get_db)):
    db_prompt = crud_prompt.get_prompt(db, prompt_id=prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    db_prompt.versions = [v for v in db_prompt.versions if v.status == 'approved']
    if not db_prompt.versions:
        raise HTTPException(status_code=404, detail="Prompt not found or not yet approved")
        
    return db_prompt

@router.get("/download/{version_id}")
def download_prompt_version(version_id: int, db: Session = Depends(deps.get_db)):
    version = db.query(prompt_models.PromptVersion).filter(prompt_models.PromptVersion.id == version_id).first()
    if not version or version.status != 'approved':
        raise HTTPException(status_code=404, detail="Version not found or not approved")
    
    file_path = Path(version.file_path)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(path=file_path, filename=f"{version.prompt.title}_v{version.version_str}.zip", media_type='application/zip')