from fastapi import APIRouter
from .stock_search import router as search_router
from .stock_quote import router as quote_router
from .stock_chart import router as chart_router
from .stock_summary import router as summary_router
from .stock_screener import router as screener_router
from .stock_news import router as news_router

# 创建主路由器
router = APIRouter()

# 包含所有子路由器
# 股票搜索接口 (stock_search_router)
router.include_router(search_router)

# 股票报价接口 (stock_quote_router)
router.include_router(quote_router)

# 股票图表接口 (stock_chart_router)
router.include_router(chart_router)

# 股票摘要接口 (stock_summary_router)
router.include_router(summary_router)

# 股票筛选器接口 (stock_screener_router)
router.include_router(screener_router)

# 股票快讯接口 (stock_news_router)
router.include_router(news_router) 