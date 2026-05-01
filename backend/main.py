from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from apis import api_router
from config import (
    BACKEND_CORS_ORIGINS,
    PROJECT_NAME,
    API_V1_STR,
    HOST,
    PORT,
    DEBUG_MODE,
    REDIS_URL,
)
from db_schemas.schemas import Base
from database import engine
from redis.asyncio import Redis
import os
import threading
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    app.state.aioredis = Redis.from_url(REDIS_URL, decode_responses=True)
    yield
    await app.state.aioredis.close()

api_app = FastAPI(
    title=PROJECT_NAME,
    description="ExamReview-API",
    version="1.0.0",
    lifespan=lifespan,
)

# 设置CORS
if BACKEND_CORS_ORIGINS:
    api_app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

api_app.include_router(api_router, prefix=API_V1_STR)

@api_app.get("/")
async def root():
    """
    根路径，返回API信息
    """
    return {
        "message": "Welcome to GoodsManagement API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@api_app.get("/health")
async def health_check():
    """
    健康检查接口
    """
    return {
        "status": "healthy",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    config = uvicorn.Config(
        app=api_app,
        host=HOST,
        port=PORT,
        log_level="info"
    )
    server = uvicorn.Server(config)
    server.run()
