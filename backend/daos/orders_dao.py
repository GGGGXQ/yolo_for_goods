from sqlalchemy.orm import Session
from sqlalchemy import desc
from db_schemas.schemas import Orders
from uuid import UUID
from datetime import datetime
import json


def get_orders_list(
    db: Session,
    page: int = 1,
    page_size: int = 10
) -> tuple[list, int]:
    """获取订单列表（分页）"""
    query = db.query(Orders)
    
    total = query.count()
    orders = query.order_by(desc(Orders.order_time)).offset((page - 1) * page_size).limit(page_size).all()
    
    return orders, total


def get_order_by_id(db: Session, order_id: UUID) -> dict:
    """根据ID获取订单详情"""
    order = db.query(Orders).filter(Orders.id == order_id).first()
    
    if not order:
        raise ValueError(f"Order {order_id} does not exist")
    
    return order.to_dict()


def create_order(db: Session, goods_info: list = None, total_price: float = 0, order_time: datetime = None, status: str = "Pending") -> Orders:
    """创建订单"""
    db_order = Orders(
        goods_info=json.dumps(goods_info, ensure_ascii=False) if goods_info else None,
        total_price=total_price,
        order_time=order_time,
        status=status
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order
