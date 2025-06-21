
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse # +++
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path # +++

from . import deps
from crud import crud_prompt
from schemas import prompt as prompt_schemas
from models import prompt as prompt_models

router = APIRouter()

@router.get(
    "/requests/pending",
    response_model=List[prompt_schemas.PublicationRequestDetails],
    dependencies=[Depends(deps.get_current_active_superuser)]
)
def list_pending_requests(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    page_size: int = Query(50, gt=0, le=100)
):
    """
    (Admin only) Get a list of all publication requests with 'pending' status.
    """
    skip = (page - 1) * page_size
    requests = crud_prompt.get_pending_requests(db, skip=skip, limit=page_size)
    return requests

@router.get(
    "/download/version/{version_id}",
    response_class=FileResponse,
    dependencies=[Depends(deps.get_current_active_superuser)]
)

def download_pending_version(
    version_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    (Admin only) Download the file for a specific prompt version,
    regardless of its status.
    """
    version = db.query(prompt_models.PromptVersion).filter(prompt_models.PromptVersion.id == version_id).first()
    
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt version not found")

    file_path = Path(version.file_path)
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")
    
    # Формируем имя файла для скачивания
    filename = f"MODERATION_{version.prompt.title}_v{version.version_str}.zip"
    
    return FileResponse(path=file_path, filename=filename, media_type='application/zip')

@router.post(
    "/requests/{request_id}/approve",
    response_model=prompt_schemas.PublicationRequestDetails,
    dependencies=[Depends(deps.get_current_active_superuser)]
)
def approve_publication_request(
    request_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    (Admin only) Approve a publication request.
    This sets the status of the request and the associated prompt version to 'approved'.
    """
    request = crud_prompt.get_publication_request(db, request_id=request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.status != prompt_models.PromptStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request has already been processed")
    
    return crud_prompt.approve_request(db=db, request=request)

@router.post(
    "/requests/{request_id}/reject",
    response_model=prompt_schemas.PublicationRequestDetails,
    dependencies=[Depends(deps.get_current_active_superuser)]
)
def reject_publication_request(
    request_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    (Admin only) Reject a publication request.
    This sets the status of the request and the associated prompt version to 'rejected'.
    """
    request = crud_prompt.get_publication_request(db, request_id=request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.status != prompt_models.PromptStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request has already been processed")

    return crud_prompt.reject_request(db=db, request=request)