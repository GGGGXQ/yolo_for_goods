from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class GoodsCreate(BaseModel):
    """创建商品请求"""
    name: str
    price: float = Field(ge=0, le=999, description="价格范围：0-999")
    stock: int = Field(ge=0, le=999, description="库存范围：0-999")


class GoodsUpdate(BaseModel):
    """更新商品请求"""
    name: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0, le=999, description="价格范围：0-999")
    stock: Optional[int] = Field(default=None, ge=0, le=999, description="库存范围：0-999")


class GoodsOut(BaseModel):
    """商品响应"""
    id: UUID
    name: str
    price: float
    stock: int

    class Config:
        from_attributes = True


class PageableGoods(BaseModel):
    """商品分页响应"""
    total_count: int
    items: list[GoodsOut]


class RecognizedItem(BaseModel):
    """识别到的商品"""
    label: str
    name: str
    count: int


class GoodsRecognizeResponse(BaseModel):
    """商品识别响应"""
    items: list[RecognizedItem]
    total: int
