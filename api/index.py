from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.modules.stock import router as stock_router
from api.modules.stock_heatmap import router as stock_heatmap_router
from api.modules.market_trends import router as market_trends_router

# Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应设置为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(stock_router, prefix="/api/py")
app.include_router(stock_heatmap_router, prefix="/api/py")
app.include_router(market_trends_router, prefix="/api/py")

# 专为 Vercel 添加的处理函数入口点
@app.get("/")
async def root():
    return {"message": "API is running"}
