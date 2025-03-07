from typing import Dict
from fastapi import APIRouter
import akshare as ak
from datetime import datetime
from .utils.logger import get_logger, log_akshare_call
from .utils.stock_data_provider import stock_data_provider

# 创建logger实例
logger = get_logger(__name__)

router = APIRouter(tags=["stock_quote"])

# 定义中国主要指数代码映射
CHINA_INDEX_MAP = {
    "sh000016": "上证50", 
    "sh000300": "沪深300",
    "sh000852": "中证1000",
    
}

@router.get("/stock/quote")
async def stock_quote(ticker: str) -> Dict:
    """
    获取股票报价API
    :param ticker: 股票代码
    :return: 股票报价信息
    """
    logger.info(f"接收到股票报价请求: {ticker}")
    try:
        # 移除前缀符号处理
        clean_ticker, is_index = stock_data_provider.standardize_ticker(ticker)
        logger.debug(f"处理后的股票代码: {clean_ticker}, 是否为指数: {is_index}")
        
        # Yahoo Finance 返回格式的基本结构
        yahoo_response = {
            "symbol": ticker,
            "shortName": "",
            "longName": "",
            "regularMarketPrice": 0,
            "regularMarketChange": 0,
            "regularMarketChangePercent": 0,
            "regularMarketDayHigh": 0,
            "regularMarketDayLow": 0,
            "regularMarketVolume": 0,
            "regularMarketOpen": 0,
            "regularMarketPreviousClose": 0,
            "bid": 0,
            "ask": 0,
            "bidSize": 0,
            "askSize": 0,
            "marketCap": 0,
            "currency": "CNY",
            "market": "cn_market",
            "exchange": "",
            "quoteType": "INDEX" if is_index else "EQUITY",
            "region": "CN",
            "language": "zh-CN",
            "fiftyTwoWeekLow": 0,
            "fiftyTwoWeekHigh": 0,
            "fiftyTwoWeekLowChange": 0,
            "fiftyTwoWeekHighChange": 0,
            "fiftyTwoWeekLowChangePercent": 0,
            "fiftyTwoWeekHighChangePercent": 0,
            "priceHint": 2,
            "fullExchangeName": "",
            "averageDailyVolume3Month": 0
        }
        
        # 使用stock_data_provider获取最新的分时数据，与图表数据来源保持一致
        logger.info(f"通过stock_data_provider获取{ticker}的最新分时数据")
        quotes = stock_data_provider.get_realtime_min_data(ticker, interval='1')
        
        if quotes and len(quotes) > 0:
            # 获取最新一条数据和第一条数据
            latest_quote = quotes[-1]
            first_quote = quotes[0] if len(quotes) > 1 else latest_quote
            
            # 计算涨跌幅
            prev_close = first_quote.get("close", 0)
            current_price = latest_quote.get("close", 0)
            
            if prev_close and prev_close > 0:
                change = current_price - prev_close
                change_percent = change / prev_close
            else:
                change = 0
                change_percent = 0
                
            # 获取当日最高最低价
            highs = [q.get("high", 0) for q in quotes if "high" in q]
            lows = [q.get("low", 0) for q in quotes if "low" in q]
            day_high = max(highs) if highs else current_price
            day_low = min(lows) if lows else current_price
            
            # 获取开盘价
            open_price = quotes[0].get("open", 0) if quotes else 0
            
            # 计算成交量
            volume = sum(q.get("volume", 0) for q in quotes if "volume" in q)
            
            # 更新响应数据
            yahoo_response.update({
                "shortName": CHINA_INDEX_MAP.get(clean_ticker, f"股票 {clean_ticker}"),
                "longName": CHINA_INDEX_MAP.get(clean_ticker, f"股票 {clean_ticker}"),
                "regularMarketPrice": current_price,
                "regularMarketChange": change,
                "regularMarketChangePercent": change_percent,
                "regularMarketDayHigh": day_high,
                "regularMarketDayLow": day_low,
                "regularMarketVolume": volume,
                "regularMarketOpen": open_price,
                "regularMarketPreviousClose": prev_close,
                "currency": "CNY",
                "exchange": "SSE" if clean_ticker.startswith("6") else "SZSE",
                "fullExchangeName": "上海证券交易所" if clean_ticker.startswith("6") else "深圳证券交易所"
            })
            
            # 计算52周数据
            yahoo_response["fiftyTwoWeekLow"] = day_low * 0.9  # 简化处理
            yahoo_response["fiftyTwoWeekHigh"] = day_high * 1.1  # 简化处理
            yahoo_response["fiftyTwoWeekLowChange"] = current_price - yahoo_response["fiftyTwoWeekLow"]
            yahoo_response["fiftyTwoWeekHighChange"] = current_price - yahoo_response["fiftyTwoWeekHigh"]
            
            # 安全除法
            if yahoo_response["fiftyTwoWeekLow"] != 0:
                yahoo_response["fiftyTwoWeekLowChangePercent"] = yahoo_response["fiftyTwoWeekLowChange"] / yahoo_response["fiftyTwoWeekLow"]
            else:
                yahoo_response["fiftyTwoWeekLowChangePercent"] = 0
                
            if yahoo_response["fiftyTwoWeekHigh"] != 0:
                yahoo_response["fiftyTwoWeekHighChangePercent"] = yahoo_response["fiftyTwoWeekHighChange"] / yahoo_response["fiftyTwoWeekHigh"]
            else:
                yahoo_response["fiftyTwoWeekHighChangePercent"] = 0
                
            # 平均成交量
            yahoo_response["averageDailyVolume3Month"] = volume
            
            logger.info(f"成功获取{ticker}的报价数据：价格={current_price}, 涨跌幅={change_percent:.2%}")
            
        else:
            logger.warning(f"无法获取{ticker}的分时数据，返回空数据")
            yahoo_response.update({
                "shortName": f"未找到 {clean_ticker} 的数据",
                "_no_data": True
            })
            
        # 添加是否有盘前盘后数据的标志 - A股没有盘前盘后
        yahoo_response["hasPrePostMarketData"] = False
        
        logger.info(f"完成数据处理: {ticker}")
        return yahoo_response
    except Exception as e:
        logger.error(f"Quote error: {str(e)}", exc_info=True)
        # 返回带有错误信息但不影响前端显示的数据
        error_response = {
            "symbol": ticker,
            "shortName": f"暂无数据",
            "longName": f"暂无数据", 
            "regularMarketPrice": 0,
            "regularMarketChange": 0,
            "regularMarketChangePercent": 0,
            "currency": "CNY",
            "quoteType": "INDEX" if ticker.startswith('^') or ticker.replace('^', '') in CHINA_INDEX_MAP else "EQUITY",
            "_error": str(e),
            "_no_data": True
        }
        logger.debug(f"返回错误响应: {error_response}")
        return error_response 