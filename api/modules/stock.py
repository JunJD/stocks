from fastapi import APIRouter
from .stock_search import router as search_router
from .stock_quote import router as quote_router
from .stock_chart import router as chart_router
from .stock_summary import router as summary_router
from .stock_screener import router as screener_router

# 创建主路由器
router = APIRouter()

# 包含所有子路由器
router.include_router(search_router)
router.include_router(quote_router)
router.include_router(chart_router)
router.include_router(summary_router)
router.include_router(screener_router) 