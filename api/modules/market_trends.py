import requests
from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
import asyncio
from typing import AsyncIterator

router = APIRouter()

@router.get("/trends")
async def get_market_trends(secid: str = "1.000016", ndays: int = 2):
    """
    获取市场指数分时数据，支持SSE（Server-Sent Events）
    
    Args:
        secid: 证券ID，格式为 "市场代码.证券代码"，默认为 "1.000016"（上证50）
        ndays: 获取的天数，默认为2
    
    Returns:
        StreamingResponse: 流式响应，将东方财富的SSE数据实时转发给前端
    """
    
    url = f"https://10.push2his.eastmoney.com/api/qt/stock/trends2/sse"
    
    params = {
        "fields1": "f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13,f17",
        "fields2": "f51,f52,f53,f54,f55,f56,f57,f58",
        "mpi": "1000",
        "ut": "fa5fd1943c7b386f172d6893dbfba10b",
        "secid": secid,
        "ndays": ndays,
        "iscr": "0",
        "iscca": "0",
        "wbp2u": "2165355837413214|0|1|0|web"
    }
    
    headers = {
        "accept": "text/event-stream",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        "origin": "https://quote.eastmoney.com",
        "pragma": "no-cache",
        "referer": "https://quote.eastmoney.com/zs000016.html",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    }

    async def event_generator() -> AsyncIterator[str]:
        with requests.get(url, params=params, headers=headers, stream=True) as r:
            r.raise_for_status()
            for line in r.iter_lines():
                if line:
                    yield f"data: {line.decode('utf-8')}\n\n"
                    await asyncio.sleep(0.01)  # 简单控制流速

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    ) 