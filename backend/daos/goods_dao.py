from sqlalchemy.orm import Session
from sqlalchemy import func
from db_schemas.schemas import Goods
from domains.goods import GoodsCreate, GoodsUpdate
from uuid import UUID
from collections import Counter


def get_goods_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str = None,
    sort: str = None
) -> tuple[list[Goods], int]:
    """获取商品列表（分页+搜索+排序）"""
    query = db.query(Goods).filter(Goods.is_deleted.is_(False))
    
    if search:
        query = query.filter(Goods.name.like(f"%{search}%"))
    
    total = query.count()
    
    if sort == "price_asc":
        query = query.order_by(Goods.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Goods.price.desc())
    elif sort == "stock_asc":
        query = query.order_by(Goods.stock.asc())
    elif sort == "stock_desc":
        query = query.order_by(Goods.stock.desc())
    else:
        query = query.order_by(Goods.created_time.desc())
    
    goods_list = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return goods_list, total


def get_goods_by_id(db: Session, goods_id: UUID) -> Goods:
    """根据ID获取商品"""
    goods = db.query(Goods).filter(
        Goods.id == goods_id,
        Goods.is_deleted.is_(False)
    ).first()
    if not goods:
        raise ValueError(f"Goods {goods_id} does not exist")
    return goods


def create_goods(db: Session, goods_data: GoodsCreate) -> Goods:
    """创建商品"""
    db_goods = Goods(
        name=goods_data.name,
        price=goods_data.price,
        stock=goods_data.stock
    )
    db.add(db_goods)
    db.commit()
    db.refresh(db_goods)
    return db_goods


def update_goods(db: Session, goods_id: UUID, goods_data: GoodsUpdate) -> Goods:
    """更新商品"""
    goods = get_goods_by_id(db, goods_id)
    
    update_data = goods_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goods, key, value)
    
    db.commit()
    db.refresh(goods)
    return goods


def delete_goods(db: Session, goods_id: UUID) -> bool:
    """删除商品（软删除）"""
    goods = get_goods_by_id(db, goods_id)
    try:
        goods.is_deleted = True
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False


def update_goods_stock(db: Session, goods_id: UUID, quantity: int) -> Goods:
    """扣减商品库存"""
    goods = get_goods_by_id(db, goods_id)
    if goods.stock < quantity:
        raise ValueError(f"Goods {goods_id} stock insufficient")
    goods.stock -= quantity
    db.commit()
    db.refresh(goods)
    return goods


def update_stock_by_labels(db: Session, label_counts: Counter) -> list[Goods]:
    """根据label统计结果更新库存（自助售卖机：库存数=识别到的数量，未识别到的不变）"""
    updated_goods = []
    
    for label, count in label_counts.items():
        goods = db.query(Goods).filter(
            Goods.label == label,
            Goods.is_deleted.is_(False)
        ).first()
        
        if goods:
            goods.stock = count
            updated_goods.append(goods)
    
    db.commit()
    for goods in updated_goods:
        db.refresh(goods)
    return updated_goods
