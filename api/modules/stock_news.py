from typing import Dict, List, Optional
from fastapi import APIRouter, Query
import akshare as ak
import pandas as pd
from datetime import datetime
from .utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["stock_news"])

@router.get("/stock/news")
async def stock_news(
    source: str = Query("sina", description="新闻来源: sina(新浪财经), eastmoney(东方财富), cls(财联社), broker_sina(新浪证券原创), cjzc(东方财富财经早餐)"),
    count: int = Query(30, description="返回的新闻数量", ge=1, le=100),
    page: int = Query(1, description="页码，仅对broker_sina有效")
) -> Dict:
    """
    获取股票快讯API
    
    支持的数据来源:
    - sina: 新浪财经全球快讯
    - eastmoney: 东方财富全球快讯
    - cls: 财联社电报
    - broker_sina: 新浪证券原创
    - cjzc: 东方财富财经早餐
    """
    logger.info(f"获取股票快讯，来源: {source}, 数量: {count}, 页码: {page}")
    
    response = {
        "items": [],
        "source": source
    }
    
    try:
        news_data = None
        
        # 根据来源选择正确的API
        if source == "sina":
            # 全球财经快讯-新浪财经
            news_data = ak.stock_info_global_sina()
        elif source == "eastmoney":
            # 全球财经快讯-东财财富
            news_data = ak.stock_info_global_em()
        elif source == "cls":
            # 电报-财联社
            news_data = ak.stock_info_global_cls(symbol="全部")
        elif source == "broker_sina":
            # 证券原创-新浪财经
            news_data = ak.stock_info_broker_sina(page=str(page))
        elif source == "cjzc":
            # 财经早餐-东财财富
            news_data = ak.stock_info_cjzc_em()
        else:
            # 默认使用新浪财经快讯
            news_data = ak.stock_info_global_sina()
            response["source"] = "sina"
        
        # 处理获取到的数据
        if news_data is not None and not news_data.empty:
            # 确保我们只返回请求的数量
            news_data = news_data.head(count)
            
            # 根据不同来源进行适配转换
            if source == "sina":
                # 全球财经快讯-新浪财经
                for _, row in news_data.iterrows():
                    news_item = {
                        "title": row.get("内容", ""),
                        "time": row.get("时间", ""),
                        "content": row.get("内容", ""),
                        "url": ""
                    }
                    response["items"].append(news_item)
            elif source == "eastmoney":
                # 全球财经快讯-东财财富
                for _, row in news_data.iterrows():
                    news_item = {
                        "title": row.get("标题", ""),
                        "time": row.get("发布时间", ""),
                        "content": row.get("摘要", ""),
                        "url": row.get("链接", "")
                    }
                    response["items"].append(news_item)
            elif source == "cls":
                # 电报-财联社
                for _, row in news_data.iterrows():
                    # 合并日期和时间
                    publish_time = ""
                    if "发布日期" in row and "发布时间" in row:
                        publish_time = f"{row['发布日期']} {row['发布时间']}"
                    
                    news_item = {
                        "title": row.get("标题", ""),
                        "time": publish_time,
                        "content": row.get("内容", ""),
                        "url": ""
                    }
                    response["items"].append(news_item)
            elif source == "broker_sina":
                # 证券原创-新浪财经
                for _, row in news_data.iterrows():
                    news_item = {
                        "title": row.get("内容", ""),
                        "time": row.get("时间", ""),
                        "content": row.get("内容", ""),
                        "url": row.get("链接", "")
                    }
                    response["items"].append(news_item)
            elif source == "cjzc":
                # 财经早餐-东财财富
                for _, row in news_data.iterrows():
                    news_item = {
                        "title": row.get("标题", ""),
                        "time": row.get("发布时间", ""),
                        "content": row.get("摘要", ""),
                        "url": row.get("链接", "")
                    }
                    response["items"].append(news_item)
            
            logger.info(f"成功获取{len(response['items'])}条{source}快讯")
        else:
            logger.warning(f"未能获取到{source}的快讯数据")
            response["error"] = f"未能获取到{source}的快讯数据"
    
    except Exception as e:
        logger.error(f"获取股票快讯失败: {str(e)}", exc_info=True)
        response["error"] = f"获取数据失败: {str(e)}"
    
    return response

@router.get("/stock/news_category")
async def news_categories() -> Dict:
    """
    获取新闻快讯类别
    """
    return {
        "categories": [
            {"id": "sina", "name": "新浪财经", "description": "新浪财经全球快讯"},
            {"id": "eastmoney", "name": "东方财富", "description": "东方财富全球快讯"},
            {"id": "cls", "name": "财联社", "description": "财联社电报"},
            {"id": "broker_sina", "name": "新浪证券", "description": "新浪证券原创"},
            {"id": "cjzc", "name": "财经早餐", "description": "东方财富财经早餐"}
        ]
    } 