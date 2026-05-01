---
name: fastapi-templates
description: Create production-ready FastAPI projects with async patterns, dependency injection, and comprehensive error handling. Use when building new FastAPI applications or setting up backend API projects.
---

# FastAPI Project Templates

Production-ready FastAPI project structures with async patterns, dependency injection, middleware, and best practices for building high-performance APIs.

## When to Use This Skill

- Starting new FastAPI projects from scratch
- Implementing async REST APIs with Python
- Building high-performance web services and microservices
- Creating async applications with PostgreSQL, MongoDB
- Setting up API projects with proper structure and testing

## Core Concepts

### 1. Project Structure

**Recommended Layout:**

```
app/
├── apis/                    
│   └── v1/
│       ├── endpoints/
│       │   ├── users.py
│       │   ├── auth.py
│       │   └── items.py
│       └── api.py              # API routes
├── core/                   # Core configuration
│   └── local.py
├── schemas/                 # Database models
│   ├── user.py
│   └── item.py
├── domains/                # Pydantic models
│   ├── user.py
│   └── item.py
├── services/               # Business logic
│   ├── user_service.py
│   └── auth_service.py
├── daos/           # Data access
│   ├── use_dao.py
│   └── item_dao.py
├── depends/
└── main.py                 # Application entry
```

### 2. Dependency Injection

FastAPI's built-in DI system using `Depends`:

- Database session management
- Authentication/authorization
- Shared business logic
- Configuration injection

### 3. Async Patterns

Proper async/await usage:

- Async route handlers
- Async database operations
- Async background tasks
- Async middleware

## Implementation Patterns

### Pattern 1: Complete FastAPI Application

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core import local
from apis.v1.api import api_router

# 创建应用
app = FastAPI(
    title=local.APP_NAME,
    version=local.APP_VERSION,
    description="APP_NAME - 后端 API v 1.0.0",
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=local.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(api_router, prefix=local.UNIFIED_PREFIX + local.API_V1_STR)


@app.get("/api/health")
def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "app_name": local.APP_NAME,
        "version": local.APP_VERSION
    }


@app.get("/")
def root():
    """根路径"""
    return {
        "message": f"欢迎使用{local.APP_NAME}",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8888, reload=True)


# core/local.py
HOST: str = "0.0.0.0"
PORT: int = 8000
DEBUG: bool = True

UNIFIED_PREFIX: str = "/writer_api"
API_V1_STR: str = "/v1"
APP_NAME: str = "商户文书写手"
APP_VERSION: str = "1.0.0"
BACKEND_CORS_ORIGINS: list[str] = ["*"]


DATABASE_URL: str = "sqlite:///./local.db"

SECRET_KEY: str = "38cc36ce-2f28-42cf-938e-f466f9240c5c"  # JWT secret (key use uuid)
TOKEN_EXPIRE_SECOND: int = 3600 * 24 * 7  # token过期时间，单位秒

# depends/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core import local

engine = create_engine(local.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close() 

# depends/redis.py
from redis.asyncio import Redis
from fastapi import Request


async def get_aioredis(request: Request) -> Redis:
    return request.app.state.aioredis

```

### Pattern 2: CRUD Repository Pattern

```python
# daos/chat_dao.py
def get_user_conversations(db: Session, user_id: UUID) -> ConversationList:
    """
    获取指定用户的所有会话列表
    :param db: 数据库会话
    :param user_id: 用户ID
    :return: 会话列表 ConversationList
    """
    conversations = db.query(DBConversation).filter(DBConversation.user_id == user_id, DBConversation.is_deleted == False).order_by(desc(DBConversation.created_time)).all()
    conversation_list = ConversationList(
        conversations=[
            Conversation(
                id=conv.id,
                title=conv.title
            ) for conv in conversations
        ],
        total=len(conversations)
    )
    return conversation_list
    
def create_user_conversation(db: Session, user_id: UUID, new_title: str="新对话") -> DBConversation:
    """
    为指定用户创建一个新的会话
    :param db: 数据库会话
    :param user_id: 用户ID
    :return: 新创建的会话 DBConversation
    """
    new_conversation = DBConversation(
        user_id=user_id,
        title=new_title
    )
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    return new_conversation

def delete_user_conversation(db: Session, conversation_id: UUID, user_id: UUID):
    """
    根据会话ID删除会话(软删除)
    """
    conversation = db.query(DBConversation).filter(DBConversation.id == conversation_id).first()
    if not conversation or conversation.user_id != user_id:
        raise ValueError("conversation not found")
    try:
        conversation.is_deleted = True
        db.commit()
        db.refresh(conversation)
        return True
    except Exception:
        db.rollback()
        return False

def rename_conversation_title(db: Session, new_title: str, conversation_id: UUID, user_id: UUID) -> DBConversation:
    conv = db.query(DBConversation).filter(DBConversation.id == conversation_id).first()
    if not conv or conv.user_id != user_id:
        raise ValueError("conversation not found")
    conv.title = new_title
    db.commit()
    db.refresh(conv)
    return conv
```

### Pattern 3: Service Layer

```python
# services/wechat_service.py
import requests
from config import local

class WeChatService:
    def __init__(self):
        self.appid = local.WECHAT_APP_ID
        self.secret = local.WECHAT_APP_SECRET

    def get_phone(self, code: str):
        url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={self.appid}&secret={self.secret}"
        access_token = requests.get(url).json().get("access_token")
        phone_url = f"https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token={access_token}"
        phone_info = requests.post(phone_url, json={"code": code}).json()
        if phone_info.get("errcode") == 0:
            return phone_info["phone_info"]["phoneNumber"]
        return None

wechat_service = WeChatService()
```

### Pattern 4: API Endpoints with apis

```python
# apis/v1/api.py
from fastapi import APIRouter
from .endpoints import ket, audio, wx_api, evaluation

api_router = APIRouter(prefix='/v1')

api_router.include_router(wx_api.wx_router, prefix="/wx_api", tags=["微信API"])
api_router.include_router(ket.router, prefix="/ket", tags=["KET"])
api_router.include_router(audio.router, prefix="/audio", tags=["语音测评"])

api_router.include_router(evaluation.evaluation_router)

# apis/v1/endpoints/ket.py
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.orm import Session
from depends.session import get_db
from daos.ket_dao import get_ket_scene_list, get_ket_scene_by_id, get_ket_questions_with_answers_by_scene_id, get_ket_scene_with_user_latest_record, get_user_all_ket_evaluations, get_ket_evaluation_result_by_id
from domains.ket import KETSceneOut, KETQuestionOut, PageableKETScene, PageableKETQuestion, SceneWithQuestionsOut, KETPracticeRecordOut, UserKETPracticeStatsOut, KETPracticeResultOut
from depends.user import authorization_verification, get_user
from domains.user import UserInToken, User
from utils.cambridge_score_mapping import get_cambridge_score_display

router = APIRouter()

@router.get("/list", response_model=PageableKETScene)
def ket_scene_list(
    page: int = Query(1, gt=0, description="页码"),
    page_size: int = Query(10, gt=0, description="每页数量"),
    part: int = Query(None, description="part"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user),
):
    """返回场景及用户最新练习信息"""
    results, total = get_ket_scene_with_user_latest_record(
        db=db,
        user_id=current_user.id,
        part=part,
        page=page,
        page_size=page_size
    )
    items = []
    for scene, total_score, level, updated_at, exercise_total, finished_at, evaluation_id in results:
        scene_data = KETSceneOut.model_validate(scene).dict()
        scene_data["total_score"] = total_score
        scene_data["level"] = level
        scene_data["updated_at"] = updated_at
        scene_data["exercise_total"] = exercise_total or 0
        scene_data["finished_at"] = finished_at.isoformat() if finished_at else None
        scene_data["evaluation_id"] = evaluation_id if evaluation_id else None
        items.append(scene_data)
    return PageableKETScene(
        total_count=total,
        items=items
    )

@router.get(
    "/scene/{scene_id}/detail_with_questions",
    response_model=SceneWithQuestionsOut,
    summary="获取场景详情及其所有问题",
    description="根据KET场景ID获取场景详情和该场景下的所有问题及答案。"
)
def get_scene_with_questions(
    scene_id: UUID = Path(..., description="场景ID（UUID）"),
    db: Session = Depends(get_db)
):
    """根据KET场景id获取场景详情和问题列表"""
    # 获取场景详情
    scene = get_ket_scene_by_id(db, scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="场景不存在")
    scene_out = KETSceneOut.model_validate(scene)

    # 获取问题及答案
    questions = get_ket_questions_with_answers_by_scene_id(db, scene_id)
    question_items = []
    for q in questions:
        q_data = KETQuestionOut.model_validate(q).dict()
        q_data["answers_total"] = len(q_data["answers"])
        question_items.append(KETQuestionOut(**q_data))

    return SceneWithQuestionsOut(
        scene=scene_out,
        questions=question_items,
        total=len(question_items)
    )


@router.get("/practice/result/{evaluation_id}", response_model=KETPracticeResultOut, summary="根据测评id获取测评结果")
def get_ket_practice_result(
    evaluation_id: UUID = Path(..., description="测评记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user),
):
    """根据测评id获取测评结果"""
    row = get_ket_evaluation_result_by_id(db, evaluation_id)
    if not row:
        raise HTTPException(status_code=404, detail="测评记录不存在")
    return KETPracticeResultOut(
        evaluation_report=row.final_evaluation_results or {},
        total_score=row.total_score,
        cambridge_score=get_cambridge_score_display(row.total_score, row.cambridge_score),
        level=row.level,
        finished_at=row.finished_at.isoformat() if row.finished_at else None,
        scene_id = row.scene_id
    )
```

## Testing

```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db, Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with AsyncSessionLocal() as session:
        yield session

@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# tests/test_users.py
import pytest

@pytest.mark.asyncio
async def test_create_user(client):
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
```

## Resources

- **references/fastapi-architecture.md**: Detailed architecture guide
- **references/async-best-practices.md**: Async/await patterns
- **references/testing-strategies.md**: Comprehensive testing guide
- **assets/project-template/**: Complete FastAPI project
- **assets/docker-compose.yml**: Development environment setup

## Best Practices

1. **Async All The Way**: Use async for database, external APIs
2. **Dependency Injection**: Leverage FastAPI's DI system
3. **Repository Pattern**: Separate data access from business logic
4. **Service Layer**: Keep business logic out of routes
5. **Pydantic Schemas**: Strong typing for request/response
6. **Error Handling**: Consistent error responses
7. **Testing**: Test all layers independently

## Common Pitfalls

- **Blocking Code in Async**: Using synchronous database drivers
- **No Service Layer**: Business logic in route handlers
- **Missing Type Hints**: Loses FastAPI's benefits
- **Ignoring Sessions**: Not properly managing database sessions
- **No Testing**: Skipping integration tests
- **Tight Coupling**: Direct database access in routes
