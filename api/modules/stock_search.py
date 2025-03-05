from typing import Dict, List
from fastapi import APIRouter
import akshare as ak
import random
from datetime import datetime
import json

router = APIRouter(tags=["stock_search"])

# 定义中国主要指数代码映射
CHINA_INDEX_MAP = {
    "sh000016": "上证50", 
    "sh000300": "沪深300",
    "sh000852": "中证1000"
}

class SearchNews:
    def __init__(self, title: str, link: str, publisher: str, publish_time: datetime):
        self.title = title
        self.link = link 
        self.publisher = publisher
        self.publish_time = publish_time

class SearchQuote:
    def __init__(self, symbol: str, shortname: str, exchange: str, type: str):
        self.symbol = symbol
        self.shortname = shortname
        self.exchange = exchange
        self.quoteType = type
        self.isYahooFinance = True

class SearchResult:
    def __init__(self):
        self.quotes: List[Dict] = []
        self.news: List[Dict] = []
        self.count: int = 0
        self.totalTime: int = 0
        self.error = None

@router.get("/stock/search")
async def stock_search(ticker: str, news_count: int = 5) -> Dict:
    """
    股票搜索API
    :param ticker: 股票代码或名称
    :param news_count: 新闻数量
    :return: 搜索结果
    """
    try:
        result = SearchResult()
        
        # 获取股票信息
        if ticker.startswith('^'):
            # 检查是否从前缀转换为中国指数代码
            clean_ticker = ticker.replace('^', '')
            try_china_index = False
            for code, name in CHINA_INDEX_MAP.items():
                if name in clean_ticker or code in clean_ticker:
                    # 找到匹配的中国指数
                    quote = SearchQuote(
                        symbol=code,
                        shortname=name,
                        exchange='SSE' if code.startswith('0') else 'SZSE',
                        type='INDEX'
                    )
                    result.quotes.append(vars(quote))
                    try_china_index = True
            
            if not try_china_index:
                try:
                    # 处理其他指数
                    # 使用 stock_zh_index_spot_sina 获取中国主要指数实时数据
                    stock_info = ak.stock_zh_index_spot_sina()
                    # 从原始代码中提取指数名称和代码，并进行搜索
                    filtered = stock_info[
                        stock_info['代码'].str.contains(ticker[1:], case=False) |
                        stock_info['名称'].str.contains(ticker[1:], case=False)
                    ]
                    
                    # 转换为SearchQuote格式
                    for _, row in filtered.iterrows():
                        quote = SearchQuote(
                            symbol=f"^{row.get('代码', ticker[1:])}",
                            shortname=row.get('名称', ''),
                            exchange='SSE',  # 假设是上交所
                            type='INDEX'
                        )
                        result.quotes.append(vars(quote))
                except Exception as e:
                    print(f"Error fetching index info: {str(e)}")
                    # 添加一些美股指数作为备选
                    indices = [
                        {"symbol": "^GSPC", "name": "标普500"},
                        {"symbol": "^DJI", "name": "道琼斯工业平均指数"},
                        {"symbol": "^IXIC", "name": "纳斯达克综合指数"}
                    ]
                    
                    for idx in indices:
                        if idx["name"].lower() in ticker.lower() or idx["symbol"].lower() in ticker.lower():
                            quote = SearchQuote(
                                symbol=idx["symbol"],
                                shortname=idx["name"],
                                exchange='NYQ',
                                type='INDEX'
                            )
                            result.quotes.append(vars(quote))
        # 直接搜索中国指数
        elif ticker in CHINA_INDEX_MAP.keys() or any(name in ticker for name in CHINA_INDEX_MAP.values()):
            # 直接匹配中国主要指数
            for code, name in CHINA_INDEX_MAP.items():
                if code == ticker or name in ticker:
                    quote = SearchQuote(
                        symbol=code,
                        shortname=name,
                        exchange='SSE' if code.startswith('0') else 'SZSE',
                        type='INDEX'
                    )
                    result.quotes.append(vars(quote))
        else:
            try:
                # 获取A股股票信息
                # 使用多个数据源尝试获取数据
                data_sources = [
                    {"name": "stock_zh_a_spot_em", "handler": lambda: ak.stock_zh_a_spot_em()},
                    {"name": "stock_zh_a_spot_tx", "handler": lambda: ak.stock_zh_a_spot_tx()},
                    {"name": "stock_info_a_code_name", "handler": lambda: ak.stock_info_a_code_name()}
                ]
                
                stock_df = None
                for source in data_sources:
                    try:
                        print(f"尝试使用数据源 {source['name']} 获取股票列表")
                        stock_df = source["handler"]()
                        
                        if stock_df is not None and not stock_df.empty:
                            print(f"从 {source['name']} 成功获取股票列表，数据条数: {len(stock_df)}")
                            
                            # 根据不同数据源调整列名映射
                            column_mappings = {
                                "stock_zh_a_spot_em": {
                                    "代码": "code", 
                                    "名称": "name"
                                },
                                "stock_zh_a_spot_tx": {
                                    "code": "code", 
                                    "name": "name"
                                },
                                "stock_info_a_code_name": {
                                    "code": "code", 
                                    "name": "name"
                                }
                            }
                            
                            # 应用列映射
                            mapping = column_mappings.get(source["name"], {})
                            if mapping:
                                stock_df = stock_df.rename(columns=mapping)
                                
                            # 确保必要的列存在
                            if "code" in stock_df.columns and "name" in stock_df.columns:
                                break
                            else:
                                print(f"数据源 {source['name']} 返回的数据列不匹配，尝试下一个数据源")
                                stock_df = None
                    except Exception as e:
                        print(f"从数据源 {source['name']} 获取数据失败: {str(e)}")
                        stock_df = None
                
                if stock_df is None:
                    raise Exception("所有数据源都无法获取股票列表")
                
                # 搜索匹配的股票
                filtered = stock_df[
                    stock_df['code'].str.contains(ticker, case=False) |
                    stock_df['name'].str.contains(ticker, case=False)
                ]
                
                # 转换为SearchQuote格式
                for _, row in filtered.iterrows():
                    code = row['code']
                    exchange = 'SHG' if code.startswith('6') else 'SHE'
                    quote = SearchQuote(
                        symbol=code,
                        shortname=row['name'],
                        exchange=exchange,
                        type='EQUITY'
                    )
                    result.quotes.append(vars(quote))
            except Exception as e:
                print(f"Error fetching A-share info: {str(e)}")
                # 如果没有结果，添加一些模拟数据
                if "00" in ticker or "60" in ticker or "30" in ticker:
                    # 可能是A股股票
                    quote = SearchQuote(
                        symbol=ticker,
                        shortname=f"模拟股票 {ticker}",
                        exchange='SHG' if ticker.startswith('6') else 'SHE',
                        type='EQUITY'
                    )
                    result.quotes.append(vars(quote))
                else:
                    # 尝试当作美股处理
                    quote = SearchQuote(
                        symbol=ticker.upper(),
                        shortname=f"模拟股票 {ticker.upper()}",
                        exchange='NYQ',
                        type='EQUITY'
                    )
                    result.quotes.append(vars(quote))
        
        # 如果没有找到结果，添加对应的空结果
        if not result.quotes:
            quote = SearchQuote(
                symbol=ticker,
                shortname=f"未找到 {ticker} 的相关结果",
                exchange='N/A',
                type='N/A'
            )
            result.quotes.append(vars(quote))
        
        # 获取相关新闻
        try:
            # 尝试获取实际新闻
            # 这里可以添加实际的新闻API调用
            # 如果找不到新闻，使用模拟数据
            for i in range(min(news_count, 5)):
                news_item = SearchNews(
                    title=f"关于 {result.quotes[0]['shortname']} 的市场动态 #{i+1}",
                    link=f"https://example.com/news/{ticker}/{i+1}",
                    publisher="模拟新闻源",
                    publish_time=datetime.now()
                )
                result.news.append(vars(news_item))
        except Exception as e:
            print(f"Error fetching news: {str(e)}")
            # 添加一些模拟新闻
            for i in range(min(news_count, 3)):
                news_item = SearchNews(
                    title=f"今日市场分析 #{i+1}",
                    link=f"https://example.com/market-news/{i+1}",
                    publisher="模拟财经网",
                    publish_time=datetime.now()
                )
                result.news.append(vars(news_item))
        
        result.count = len(result.quotes)
        result.totalTime = 0
        
        return vars(result)
    except Exception as e:
        result = SearchResult()
        result.error = str(e)
        return vars(result) 