from typing import Dict, List
from fastapi import APIRouter
import akshare as ak
from datetime import datetime
import json

router = APIRouter(tags=["stock_search"])

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
            try:
                # 处理指数
                # 注意：以下使用 stock_zh_index_spot_sina 代替不存在的 index_zh_a_spot
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
                
        else:
            try:
                # 处理普通股票
                stock_info = ak.stock_info_a_code_name()
                filtered = stock_info[
                    stock_info['code'].str.contains(ticker, case=False) |
                    stock_info['name'].str.contains(ticker, case=False)
                ]
                
                # 转换为SearchQuote格式
                for _, row in filtered.iterrows():
                    quote = SearchQuote(
                        symbol=row.get('code', ticker),
                        shortname=row.get('name', ''),
                        exchange='SSE' if str(row.get('code', '')).startswith('6') else 'SZSE',
                        type='EQUITY'
                    )
                    result.quotes.append(vars(quote))
            except Exception as e:
                print(f"Error fetching stock info: {str(e)}")
        
        # 获取相关新闻
        if len(result.quotes) > 0:
            try:
                first_symbol = result.quotes[0]['symbol'].replace('^', '')
                news_info = ak.stock_news_em(symbol=first_symbol)
                for _, news in news_info.head(news_count).iterrows():
                    news_item = SearchNews(
                        title=news.get('title', ''),
                        link=news.get('url', ''),
                        publisher=news.get('source', '东方财富网'),
                        publish_time=datetime.strptime(news.get('datetime', ''), '%Y-%m-%d %H:%M:%S')
                    )
                    result.news.append(vars(news_item))
            except Exception as e:
                print(f"Error fetching news: {str(e)}")
                
        result.count = len(result.quotes)
        result.totalTime = 0
        
        return vars(result)
        
    except Exception as e:
        print(f"Search error: {str(e)}")
        return {
            "error": f"Failed to fetch stock search: {str(e)}",
            "quotes": [],
            "news": [],
            "count": 0,
            "totalTime": 0
        } 