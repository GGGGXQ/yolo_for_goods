from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class GoodsInfoItem(BaseModel):
    """订单中的商品信息"""
    goods_id: Optional[UUID] = None
    name: str
    quantity: int
    single_price: float


class OrderOut(BaseModel):
    """订单响应"""
    id: UUID
    goods_info: Optional[List[GoodsInfoItem]] = None
    total_price: float
    order_time: datetime
    status: str

    class Config:
        from_attributes = True


class PageableOrders(BaseModel):
    """订单分页响应"""
    total_count: int
    items: list[OrderOut]
