from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Text,
    Integer,
    REAL,
    DateTime,
    JSON,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import text


class Base(DeclarativeBase):
    __name__: str
    __abstract__ = True

    created_time = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_time = Column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
    )

    def to_dict(self, include=None, exclude=[], name_map={}):
        return {
            (c.name if not name_map.get(c.name) else name_map.get(c.name)): getattr(
                self, c.name, None
            )
            for c in self.__table__.columns
            if (c.name not in exclude) and (include is None or c.name in include)
        }

class DBUser(Base):
    """用户"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)

class Goods(Base):
    """商品表"""
    __tablename__ = "goods"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(100), nullable=False, comment="商品名称")
    label = Column(String(100), nullable=True, comment="YOLO识别标签")
    price = Column(REAL, nullable=False, default=0, comment="销售价格")
    stock = Column(Integer, nullable=False, default=0, comment="当前库存")
    is_deleted = Column(Boolean, nullable=False, default=False, comment="是否删除")


class Orders(Base):
    """订单表"""
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    goods_info = Column(Text, nullable=True, comment="商品信息列表(JSON)")
    total_price = Column(REAL, nullable=False, default=0, comment="应付总额")
    order_time = Column(DateTime, nullable=False, comment="订单时间")
    status = Column(String(20), nullable=False, default="Pending", comment="订单状态: Pending/Completed/Shipped")
