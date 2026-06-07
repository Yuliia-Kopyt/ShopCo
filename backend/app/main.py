from fastapi import FastAPI

from app.database.base import Base
from app.database.database import engine

from app.api.auth import router as auth_router
from app.api.products import router as products_router

import app.models
from fastapi.middleware.cors import CORSMiddleware

from app.api.translations import router as translations_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ShopCo API",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(translations_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "ShopCo API is running"
    }