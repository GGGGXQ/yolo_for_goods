from fastapi import APIRouter
from apis.user import user_router
from apis.goods import goods_router
from apis.orders import orders_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(user_router)
api_router.include_router(goods_router)
api_router.include_router(orders_router)