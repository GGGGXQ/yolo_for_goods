from uuid import UUID
from datetime import datetime
from traceback import format_exc
from collections import Counter
import tempfile
import os
import json

from fastapi import APIRouter, Depends, Query, HTTPException, Path, UploadFile, File
from sqlalchemy.orm import Session

from depends.session import get_db_dep
from daos import orders_dao, goods_dao
from domains.orders import OrderOut, PageableOrders, GoodsInfoItem
from domains.users import User
from utils.jwt_util import get_current_user
from utils.logger_util import logger
from apis.goods import yolo_model

orders_router = APIRouter(prefix="/orders", tags=["orders"])


@orders_router.get("/list", response_model=PageableOrders, summary="获取订单列表")
def get_orders_list(
    page: int = Query(1, gt=0, description="页码"),
    page_size: int = Query(5, gt=0, description="每页数量"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """获取订单列表（分页）"""
    try:
        orders, total = orders_dao.get_orders_list(
            db=db,
            page=page,
            page_size=page_size
        )
        
        items = []
        for order in orders:
            order_dict = order.to_dict()
            if order_dict.get("goods_info"):
                order_dict["goods_info"] = json.loads(order_dict["goods_info"])
            items.append(OrderOut(**order_dict))
        
        return PageableOrders(total_count=total, items=items)
    except Exception as e:
        logger.error(f"获取订单列表失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="获取订单列表失败"
        )


@orders_router.get("/{order_id}", response_model=OrderOut, summary="获取订单详情")
def get_order_detail(
    order_id: UUID = Path(..., description="订单ID"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """获取订单详情"""
    try:
        order_dict = orders_dao.get_order_by_id(db=db, order_id=order_id)
        if order_dict.get("goods_info"):
            order_dict["goods_info"] = json.loads(order_dict["goods_info"])
        return OrderOut(**order_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"获取订单详情失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="获取订单详情失败"
        )


@orders_router.post("/simulate", response_model=OrderOut, summary="模拟下单（两张图片对比）")
async def simulate_orders(
    before_image: UploadFile = File(..., description="开门前图片"),
    after_image: UploadFile = File(..., description="关门后图片"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """模拟下单：上传开门前和关门后的图片，对比识别结果生成订单"""
    try:
        before_path = None
        after_path = None
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_before:
            content = await before_image.read()
            tmp_before.write(content)
            before_path = tmp_before.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_after:
            content = await after_image.read()
            tmp_after.write(content)
            after_path = tmp_after.name

        before_results = yolo_model.predict(
            source=before_path,
            save=False,
            save_txt=False,
            show=False,
            conf=0.25,
            line_width=2
        )
        
        after_results = yolo_model.predict(
            source=after_path,
            save=False,
            save_txt=False,
            show=False,
            conf=0.25,
            line_width=2
        )

        os.unlink(before_path)
        os.unlink(after_path)

        before_counts = Counter()
        for cls_id in before_results[0].boxes.cls.cpu().numpy().astype(int).tolist():
            before_counts[str(cls_id)] += 1

        after_counts = Counter()
        for cls_id in after_results[0].boxes.cls.cpu().numpy().astype(int).tolist():
            after_counts[str(cls_id)] += 1

        diff_counts = {}
        for label in before_counts:
            diff = before_counts[label] - after_counts.get(label, 0)
            if diff > 0:
                diff_counts[label] = diff

        if not diff_counts:
            order = orders_dao.create_order(
                db=db,
                goods_info=None,
                total_price=0,
                order_time=datetime.now(),
                status="Cancelled"
            )
            order_dict = order.to_dict()
            order_dict["goods_info"] = None
            return OrderOut(**order_dict)

        goods_info_list = []
        total_price = 0
        
        for label, quantity in diff_counts.items():
            goods = db.query(goods_dao.Goods).filter(
                goods_dao.Goods.label == label,
                goods_dao.Goods.is_deleted.is_(False)
            ).first()
            
            if not goods:
                continue
            
            goods_dao.update_goods_stock(db, goods.id, -quantity)
            
            goods_info_list.append({
                "goods_id": goods.id,
                "name": goods.name,
                "quantity": quantity,
                "single_price": goods.price,
            })
            total_price += goods.price * quantity
        
        order = orders_dao.create_order(
            db=db,
            goods_info=goods_info_list,
            total_price=total_price,
            order_time=datetime.now(),
            status="Completed"
        )
        
        order_dict = order.to_dict()
        order_dict["goods_info"] = goods_info_list
        return OrderOut(**order_dict)
    except Exception as e:
        logger.error(f"模拟下单失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="模拟下单失败"
        )
