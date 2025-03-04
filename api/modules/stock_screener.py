from typing import Dict
from fastapi import APIRouter
import akshare as ak
import random

router = APIRouter(tags=["stock_screener"])

def generate_mock_stock_for_screener(symbol, name, 
                                     price_range=(10, 500), 
                                     percent_change_range=(-5, 5), 
                                     volume_range=(50000, 2000000)):
    base_price = random.uniform(*price_range)
    percent_change = random.uniform(*percent_change_range)
    change = base_price * percent_change / 100
    price = base_price + change
    volume = random.randint(*volume_range)
    
    return {
        "symbol": symbol,
        "shortName": f"{name} ({symbol})",
        "longName": name,
        "regularMarketPrice": price,
        "regularMarketChange": change,
        "regularMarketChangePercent": percent_change,
        "regularMarketVolume": volume,
        "regularMarketDayHigh": price * (1 + random.uniform(0, 2) / 100),
        "regularMarketDayLow": price * (1 - random.uniform(0, 2) / 100),
        "regularMarketOpen": base_price,
        "regularMarketPreviousClose": base_price,
        "marketCap": price * volume * random.uniform(0.8, 1.2),
        "currency": "CNY",
        "exchange": "SSE" if symbol.startswith('6') else "SZSE",
        "fullExchangeName": "上海证券交易所" if symbol.startswith('6') else "深圳证券交易所",
        "quoteType": "EQUITY"
    }

@router.get("/stock/screener")
async def stock_screener(screener: str = "most_actives", count: int = 40) -> Dict:
    """
    股票筛选器API
    :param screener: 筛选器类型：most_actives, day_gainers, day_losers等
    :param count: 返回数量
    :return: 筛选结果
    """
    try:
        # 模拟不同类型的筛选器逻辑
        response = {"quotes": []}
        stocks = []
        
        # 获取A股股票列表作为基础数据
        try:
            stock_info = ak.stock_info_a_code_name()
            # 限制数量，否则可能过多
            stock_info = stock_info.head(count)
        except Exception as e:
            print(f"获取股票列表失败: {str(e)}")
            # 生成一些模拟数据作为备用
            for i in range(count):
                symbol = f"00{i+1000}"
                stocks.append({
                    "symbol": symbol,
                    "name": f"模拟股票{i+1}"
                })
        else:
            # 从实际数据中构造股票列表
            for _, row in stock_info.iterrows():
                stocks.append({
                    "symbol": row.get('code', ''),
                    "name": row.get('name', '')
                })
        
        # 根据筛选类型处理数据
        if screener == "most_actives":
            title = "交易最活跃"
            # 模拟活跃度 - 随机高交易量
            for stock in stocks:
                quote = generate_mock_stock_for_screener(stock["symbol"], stock["name"], 
                                                         volume_range=(1000000, 10000000),
                                                         percent_change_range=(-5, 5))
                response["quotes"].append(quote)
                
        elif screener == "day_gainers":
            title = "日涨幅最大"
            # 模拟大涨股票 - 涨幅为正且较大
            for stock in stocks:
                quote = generate_mock_stock_for_screener(stock["symbol"], stock["name"], 
                                                         volume_range=(100000, 5000000),
                                                         percent_change_range=(2, 10))
                response["quotes"].append(quote)
                
        elif screener == "day_losers":
            title = "日跌幅最大"
            # 模拟大跌股票 - 跌幅为负且较大
            for stock in stocks:
                quote = generate_mock_stock_for_screener(stock["symbol"], stock["name"], 
                                                         volume_range=(100000, 5000000),
                                                         percent_change_range=(-10, -2))
                response["quotes"].append(quote)
                
        else:
            title = f"筛选器: {screener}"
            # 其他类型的筛选器，生成一般随机数据
            for stock in stocks:
                quote = generate_mock_stock_for_screener(stock["symbol"], stock["name"])
                response["quotes"].append(quote)
        
        # 对结果排序，使其显得更真实
        if screener == "day_gainers":
            response["quotes"].sort(key=lambda x: x.get("regularMarketChangePercent", 0), reverse=True)
        elif screener == "day_losers":
            response["quotes"].sort(key=lambda x: x.get("regularMarketChangePercent", 0))
        elif screener == "most_actives":
            response["quotes"].sort(key=lambda x: x.get("regularMarketVolume", 0), reverse=True)
        
        response["title"] = title
        response["count"] = len(response["quotes"])
        response["start"] = 0
        response["total"] = len(response["quotes"])
        
        return response
    except Exception as e:
        print(f"Screener error: {str(e)}")
        return {
            "error": f"Failed to fetch screener data: {str(e)}",
            "quotes": [],
            "count": 0,
            "total": 0,
            "title": f"Error: {screener}"
        } 