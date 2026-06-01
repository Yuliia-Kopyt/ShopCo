from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate
from app.models.user import User
from app.database.database import get_db
from app.core.security import get_password_hash

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    hashed = get_password_hash(user.password)

    print("ORIGINAL:", user.password)
    print("HASHED:", hashed)

    new_user = User(
        email=user.email,
        password_hash=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email
    }