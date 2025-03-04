from fastapi import FastAPI
from api.modules.stock import router as stock_router

# Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Register routers
app.include_router(stock_router, prefix="/api/py")

@app.get("/")
async def root():
    return {"message": "Hello World"}
