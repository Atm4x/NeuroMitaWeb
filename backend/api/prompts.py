import uuid
from pathlib import Path
import zipfile
import io
import tiktoken
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Response
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
MAX_ZIP_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_UNCOMPRESSED_SIZE = 10 * 1024 * 1024 # 10 MB, защита от zip-бомб
ALLOWED_EXTENSIONS = {".txt", ".script", ".postscript"}

# Инициализируем кодировщик токенов
try:
    encoding = tiktoken.get_encoding("cl100k_base")
except Exception:
    encoding = None

async def process_and_validate_zip(file: UploadFile) -> (int, bytes):
    """
    Безопасно валидирует ZIP-файл, подсчитывает токены из разрешенных файлов
    и возвращает количество токенов и содержимое файла.
    """
    # 1. Проверяем общий размер файла перед чтением в память
    contents = await file.read()
    if len(contents) > MAX_ZIP_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Размер ZIP-файла не должен превышать {MAX_ZIP_SIZE / 1024 / 1024} МБ."
        )

    # 2. Подготовка к обработке
    total_uncompressed_size = 0
    all_text_content = []
    
    if not encoding:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Кодировщик токенов недоступен."
        )

    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as zf:
            # Предварительная проверка на zip-бомбу по сумме размеров
            uncompressed_sum = sum(info.file_size for info in zf.infolist())
            if uncompressed_sum > MAX_UNCOMPRESSED_SIZE:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Распакованный размер архива превышает лимит в {MAX_UNCOMPRESSED_SIZE / 1024 / 1024} МБ."
                )

            for member in zf.infolist():
                # Безопасность: предотвращаем атаки path traversal
                if ".." in member.filename or member.filename.startswith(("/", "\\")):
                    continue

                # Игнорируем директории
                if member.is_dir():
                    continue

                # Проверяем расширение файла
                file_ext = Path(member.filename).suffix.lower()
                if file_ext not in ALLOWED_EXTENSIONS:
                    continue

                # Безопасность: итеративно проверяем размер (защита от zip-бомб)
                total_uncompressed_size += member.file_size
                if total_uncompressed_size > MAX_UNCOMPRESSED_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Распакованный размер архива превышает лимит в {MAX_UNCOMPRESSED_SIZE / 1024 / 1024} МБ."
                    )

                # Читаем и декодируем содержимое
                try:
                    with zf.open(member) as member_file:
                        file_content = member_file.read()
                        all_text_content.append(file_content.decode('utf-8', errors='ignore'))
                except Exception:
                    # Игнорируем поврежденные или защищенные паролем файлы
                    continue

    except zipfile.BadZipFile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный или поврежденный ZIP-файл.")
    
    # 3. Подсчитываем токены
    if not all_text_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Архив должен содержать хотя бы один файл с расширением: {', '.join(ALLOWED_EXTENSIONS)}")

    full_text = "\n\n".join(all_text_content)
    num_tokens = len(encoding.encode(full_text))

    return num_tokens, contents

@router.post("", status_code=status.HTTP_201_CREATED, response_model=prompt_schemas.Prompt)
async def create_prompt(
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
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Поддерживаются только .zip файлы.")

    try:
        calculated_tokens, file_contents = await process_and_validate_zip(file)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Произошла ошибка при обработке файла: {e}")

    if crud_prompt.get_prompt_by_title_and_character(db, title=title, character_id=character_id):
        raise HTTPException(status_code=400, detail="Промпт с таким названием для этого персонажа уже существует.")

    file_name = f"{uuid.uuid4()}.zip"
    file_path = MEDIA_ROOT / file_name
    with file_path.open("wb") as buffer:
        buffer.write(file_contents)

    prompt_in = prompt_schemas.PromptCreate(
        title=title, character_id=character_id, type=type,
        description=description, extended_description=extended_description
    )
    version_in = prompt_schemas.PromptVersionCreate(version_str=version_str, notes=notes, tokens=calculated_tokens)
    
    db_prompt = crud_prompt.create_prompt_with_version(
        db, prompt=prompt_in, version=version_in, user_id=current_user.id, file_path=str(file_path)
    )
    return db_prompt

@router.post("/{prompt_id}/versions", status_code=status.HTTP_201_CREATED, response_model=prompt_schemas.PromptVersion)
async def create_new_version(
    prompt_id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: user_models.User = Depends(deps.get_current_user),
    version_str: str = Form(...),
    notes: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Поддерживаются только .zip файлы.")

    db_prompt = crud_prompt.get_prompt(db, prompt_id=prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Промпт не найден.")
    
    if db_prompt.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для обновления этого промпта.")

    if any(v.version_str == version_str for v in db_prompt.versions):
        raise HTTPException(status_code=400, detail="Эта версия для данного промпта уже существует.")

    try:
        calculated_tokens, file_contents = await process_and_validate_zip(file)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Произошла ошибка при обработке файла: {e}")

    file_name = f"{uuid.uuid4()}.zip"
    file_path = MEDIA_ROOT / file_name
    with file_path.open("wb") as buffer:
        buffer.write(file_contents)

    version_in = prompt_schemas.PromptVersionCreate(version_str=version_str, notes=notes, tokens=calculated_tokens)
    
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