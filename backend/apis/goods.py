from uuid import UUID
from traceback import format_exc
from collections import Counter
import tempfile
import os

from fastapi import APIRouter, Depends, Query, HTTPException, Path, UploadFile, File
from sqlalchemy.orm import Session
from ultralytics import YOLO

from depends.session import get_db_dep
from daos import goods_dao
from db_schemas.schemas import Goods
from domains.goods import GoodsCreate, GoodsUpdate, GoodsOut, PageableGoods, GoodsRecognizeResponse, RecognizedItem
from domains.users import User
from utils.jwt_util import get_current_user
from utils.logger_util import logger

goods_router = APIRouter(prefix="/goods", tags=["goods"])

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "runs", "detect", "train", "weights", "best.pt")
yolo_model = YOLO(MODEL_PATH)


@goods_router.get("/list", response_model=PageableGoods, summary="获取商品列表")
def get_goods_list(
    page: int = Query(1, gt=0, description="页码"),
    page_size: int = Query(10, gt=0, description="每页数量"),
    search: str = Query(None, description="搜索关键词"),
    sort: str = Query(None, description="排序字段：price_asc, price_desc, stock_asc, stock_desc"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """获取商品列表（支持分页、搜索和排序）"""
    try:
        goods_list, total = goods_dao.get_goods_list(
            db=db,
            page=page,
            page_size=page_size,
            search=search,
            sort=sort
        )
        items = [GoodsOut.model_validate(goods) for goods in goods_list]
        return PageableGoods(total_count=total, items=items)
    except Exception as e:
        logger.error(f"获取商品列表失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="获取商品列表失败"
        )


@goods_router.post("", response_model=GoodsOut, summary="新增商品")
def create_goods(
    goods_data: GoodsCreate,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """新增商品"""
    try:
        new_goods = goods_dao.create_goods(db=db, goods_data=goods_data)
        return GoodsOut.model_validate(new_goods)
    except Exception as e:
        logger.error(f"新增商品失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="新增商品失败"
        )


@goods_router.put("/{goods_id}", response_model=GoodsOut, summary="更新商品")
def update_goods(
    goods_data: GoodsUpdate,
    goods_id: str = Path(..., description="商品ID"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """更新商品信息"""
    try:
        updated_goods = goods_dao.update_goods(db=db, goods_id=goods_id, goods_data=goods_data)
        return GoodsOut.model_validate(updated_goods)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"更新商品失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="更新商品失败"
        )


@goods_router.delete("/{goods_id}", summary="删除商品")
def delete_goods(
    goods_id: str = Path(..., description="商品ID"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """删除商品（软删除）"""
    try:
        success = goods_dao.delete_goods(db=db, goods_id=goods_id)
        if not success:
            raise HTTPException(status_code=500, detail="删除商品失败")
        return {"message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"删除商品失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="删除商品失败"
        )


@goods_router.post("/recognize", response_model=GoodsRecognizeResponse, summary="识别商品")
async def recognize_goods(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    """上传商品图片进行YOLO识别，并更新库存"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        results = yolo_model.predict(
            source=tmp_path,
            save=False,
            save_txt=False,
            show=False,
            conf=0.25,
            line_width=2
        )

        os.unlink(tmp_path)

        result = results[0]
        class_ids = result.boxes.cls.cpu().numpy().astype(int).tolist()

        label_counts = Counter()
        for cls_id in class_ids:
            label_counts[str(cls_id)] += 1

        updated_goods = goods_dao.update_stock_by_labels(db=db, label_counts=label_counts)

        recognized_items = [
            RecognizedItem(
                label=goods.label,
                name=goods.name,
                count=label_counts[goods.label]
            )
            for goods in updated_goods
        ]

        return GoodsRecognizeResponse(
            items=recognized_items,
            total=sum(label_counts.values())
        )
    except Exception as e:
        logger.error(f"识别商品失败: {str(e)}")
        logger.error(format_exc())
        raise HTTPException(
            status_code=500,
            detail="识别商品失败"
        )
