from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks 
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.schemas.user import UserCreate
from app.models.user import User
from app.database.database import get_db

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

# Імпортуємо функцію реєстраційного листа з нового чистого модуля утиліт
from app.core.email import send_registration_welcome 

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(
    user: UserCreate,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):

    existing_user = db.scalar(
        select(User).where(User.email == user.email)
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    hashed = get_password_hash(user.password)

    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # --- БЕЗПЕЧНА ВІДПРАВКА ЛИСТА ЧЕРЕЗ BACKGROUND TASKS ---
    try:
        user_name = new_user.first_name if new_user.first_name else "Користувач"
        background_tasks.add_task(send_registration_welcome, target_email=new_user.email, name=user_name)
    except Exception as e:
        print(f"❌ Не вдалося надіслати email: {e}")
    # -----------------------------------------------------

    return {
        "id": new_user.id,
        "email": new_user.email
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    existing_user = db.scalar(
        select(User).where(
            User.email == form_data.username
        )
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        form_data.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": existing_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }