from fastapi import FastAPI

from app.database.base import Base
from app.database.database import engine

from app.api.auth import router as auth_router
from app.api.products import router as products_router

import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShopCo API",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(products_router)


@app.get("/")
def root():
    return {
        "message": "ShopCo API is running"
    }