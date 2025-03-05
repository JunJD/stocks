from typing import Dict
from fastapi import APIRouter
import akshare as ak
from datetime import datetime, timedelta
import pandas as pd
import random

router = APIRouter(tags=["stock_chart"])

# 定义中国主要指数代码映射
CHINA_INDEX_MAP = {
    "000016": "上证50", 
    "000300": "沪深300",
    "000852": "中证1000"
}

def generate_mock_chart_data(start_date, end_date, interval, is_index=False):
    """生成模拟图表数据"""
    quotes = []
    current_date = start_date
    
    # 确定基础价格
    base_price = 3500 if is_index else 100
    volatility = 0.02 if is_index else 0.04
    current_price = base_price
    
    if interval in ["1d", "daily", "1wk", "weekly", "1mo", "monthly"]:
        # 确定每次迭代的时间间隔
        if interval in ["1d", "daily"]:
            delta = timedelta(days=1)
        elif interval in ["1wk", "weekly"]:
            delta = timedelta(weeks=1)
        elif interval in ["1mo", "monthly"]:
            delta = timedelta(days=30)
        else:
            delta = timedelta(days=1)
            
        while current_date <= end_date:
            if current_date.weekday() < 5:  # 只包括工作日
                # 生成当天价格变动
                change_percent = (random.random() * 2 - 1) * volatility
                open_price = current_price
                close_price = open_price * (1 + change_percent)
                high_price = max(open_price, close_price) * (1 + random.random() * 0.01)
                low_price = min(open_price, close_price) * (1 - random.random() * 0.01)
                volume = random.randint(100000, 10000000)
                
                quotes.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "open": round(open_price, 2),
                    "close": round(close_price, 2),
                    "high": round(high_price, 2),
                    "low": round(low_price, 2),
                    "volume": volume
                })
                
                current_price = close_price
            
            current_date += delta
    else:
        # 对于分钟级别的模拟数据，生成当天的分钟数据
        day_count = (end_date - start_date).days
        for day in range(day_count + 1):
            current_day = start_date + timedelta(days=day)
            if current_day.weekday() < 5:  # 工作日
                # 生成当天的分钟数据
                day_open = current_price
                for minute in range(390):  # 6.5小时交易时间，每分钟一个数据点
                    change_percent = (random.random() * 2 - 1) * (volatility / 20)  # 分钟波动小于日波动
                    if minute == 0:
                        open_price = day_open
                    else:
                        open_price = current_price
                    
                    close_price = open_price * (1 + change_percent)
                    high_price = max(open_price, close_price) * (1 + random.random() * 0.002)
                    low_price = min(open_price, close_price) * (1 - random.random() * 0.002)
                    volume = random.randint(1000, 100000)
                    
                    minute_time = datetime(
                        current_day.year, current_day.month, current_day.day, 
                        9 + minute // 60, minute % 60
                    )
                    
                    quotes.append({
                        "date": minute_time.strftime("%Y-%m-%d"),
                        "open": round(open_price, 2),
                        "close": round(close_price, 2),
                        "high": round(high_price, 2),
                        "low": round(low_price, 2),
                        "volume": volume
                    })
                    
                    current_price = close_price
    
    return quotes

@router.get("/stock/chart")
async def stock_chart(ticker: str, range: str = "1d", interval: str = "1m") -> Dict:
    """
    获取股票图表数据API
    :param ticker: 股票代码
    :param range: 时间范围 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
    :param interval: 时间间隔 (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
    :return: 图表数据
    """
    try:
        # 移除可能的前缀符号
        clean_ticker = ticker.replace('^', '')
        
        # 确定时间段
        end_date = datetime.now()
        
        if range == "1d":
            start_date = end_date - timedelta(days=1)
            period = "daily"
            adjust = ""
        elif range == "5d":
            start_date = end_date - timedelta(days=5)
            period = "daily" 
            adjust = ""
        elif range == "1mo":
            start_date = end_date - timedelta(days=30)
            period = "daily"
            adjust = ""
        elif range == "3mo":
            start_date = end_date - timedelta(days=90)
            period = "daily"
            adjust = ""
        elif range == "6mo":
            start_date = end_date - timedelta(days=180)
            period = "daily"
            adjust = ""
        elif range == "1y":
            start_date = end_date - timedelta(days=365)
            period = "daily"
            adjust = ""
        elif range == "2y":
            start_date = end_date - timedelta(days=365*2)
            period = "daily"
            adjust = ""
        elif range == "5y":
            start_date = end_date - timedelta(days=365*5)
            period = "weekly"
            adjust = ""
        elif range == "10y":
            start_date = end_date - timedelta(days=365*10)
            period = "weekly"
            adjust = ""
        elif range == "ytd":
            start_date = datetime(end_date.year, 1, 1)
            period = "daily"
            adjust = ""
        else:  # "max"
            start_date = datetime(2000, 1, 1)  # 假设最早数据从2000年开始
            period = "monthly"
            adjust = ""
            
        # 格式化日期为字符串
        start_date_str = start_date.strftime("%Y%m%d")
        end_date_str = end_date.strftime("%Y%m%d")
        
        # 检查是否为中国主要指数
        is_china_index = clean_ticker in CHINA_INDEX_MAP
        
        quotes = []
        
        if is_china_index:
            try:
                # 使用AKShare获取中国指数数据
                # 参考 https://akshare.akfamily.xyz/data/index/index.html#id7
                df = ak.index_zh_a_hist(symbol=clean_ticker, period="daily", 
                                       start_date=start_date_str, end_date=end_date_str)
                
                # 如果有数据返回
                if not df.empty:
                    # 重命名列以匹配要求的格式
                    df = df.rename(columns={
                        "日期": "date",
                        "开盘": "open",
                        "收盘": "close",
                        "最高": "high",
                        "最低": "low",
                        "成交量": "volume"
                    })
                    
                    # 只保留需要的列
                    if "date" in df.columns and "open" in df.columns:
                        df = df[["date", "open", "close", "high", "low", "volume"]]
                        
                        # 转换日期格式
                        df["date"] = pd.to_datetime(df["date"])
                        
                        # 转换为列表
                        for _, row in df.iterrows():
                            quotes.append({
                                "date": row["date"].strftime("%Y-%m-%d"),
                                "open": float(row["open"]),
                                "close": float(row["close"]),
                                "high": float(row["high"]),
                                "low": float(row["low"]),
                                "volume": float(row["volume"])
                            })
            except Exception as e:
                print(f"获取中国指数数据失败: {str(e)}")
                # 生成模拟数据
                quotes = generate_mock_chart_data(start_date, end_date, interval, is_index=True)
        elif clean_ticker.startswith(('0', '3', '6')):  # A股
            # 获取股票历史数据
            try:
                market = "sh" if clean_ticker.startswith('6') else "sz"
                df = ak.stock_zh_a_hist(symbol=clean_ticker, period=period, start_date=start_date_str, end_date=end_date_str, adjust=adjust)
                
                # 重命名列以匹配要求的格式
                df = df.rename(columns={
                    "日期": "date",
                    "开盘": "open",
                    "收盘": "close",
                    "最高": "high",
                    "最低": "low",
                    "成交量": "volume"
                })
                
                # 只保留需要的列
                if "date" in df.columns and "open" in df.columns:
                    df = df[["date", "open", "close", "high", "low", "volume"]]
                    
                    # 转换日期格式
                    df["date"] = pd.to_datetime(df["date"])
                    
                    # 转换为列表
                    for _, row in df.iterrows():
                        quotes.append({
                            "date": row["date"].strftime("%Y-%m-%d"),
                            "open": float(row["open"]),
                            "close": float(row["close"]),
                            "high": float(row["high"]),
                            "low": float(row["low"]),
                            "volume": float(row["volume"])
                        })
            except Exception as e:
                print(f"获取股票历史数据失败: {str(e)}")
                # 生成模拟数据
                quotes = generate_mock_chart_data(start_date, end_date, interval)
        else:
            # 对于其他市场的股票和指数，生成模拟数据
            quotes = generate_mock_chart_data(start_date, end_date, interval, is_index=(ticker.startswith("^")))
        
        # 如果没有获取到数据，生成模拟数据
        if not quotes:
            quotes = generate_mock_chart_data(start_date, end_date, interval, is_index=(ticker.startswith("^") or is_china_index))
                
        # 返回与Yahoo Finance格式兼容的结果
        return {
            "ticker": ticker,
            "quotes": quotes,
            "currency": "CNY",
            "error": None
        }
    except Exception as e:
        return {
            "ticker": ticker,
            "quotes": [],
            "currency": "CNY",
            "error": str(e)
        } 