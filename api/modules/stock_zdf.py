"""
股票涨跌幅分布API模块
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from .utils.stock_data_fetcher import fetch_stock_zdf_distribution

router = APIRouter()

class ZDFDistributionResponse(BaseModel):
    """涨跌幅分布响应模型"""
    date: int
    distribution: Dict[str, int]
    formatted_distribution: Dict[str, int]
    summary: Dict[str, int]

@router.get("/market/zdf/distribution", response_model=ZDFDistributionResponse, tags=["市场数据"], summary="获取股票涨跌幅分布")
async def get_stock_zdf_distribution():
    """
    获取A股市场涨跌幅分布数据
    
    返回当前交易日的股票涨跌幅分布情况，包括各涨跌幅区间的股票数量统计
    
    Returns:
        ZDFDistributionResponse: 涨跌幅分布数据
    """
    try:
        # 调用工具函数获取数据
        result = fetch_stock_zdf_distribution()
        
        if not result:
            raise HTTPException(status_code=404, detail="未能获取涨跌幅分布数据")
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取涨跌幅分布数据失败: {str(e)}") 