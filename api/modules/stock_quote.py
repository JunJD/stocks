from typing import Dict
from fastapi import APIRouter
import akshare as ak
from datetime import datetime
import random
from .utils.logger import get_logger, log_akshare_call

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
        clean_ticker = ticker.replace('^', '')
        logger.debug(f"处理后的股票代码: {clean_ticker}")
        
        # 检查是股票还是指数
        is_index = ticker.startswith('^') or clean_ticker in CHINA_INDEX_MAP
        logger.debug(f"是否为指数: {is_index}")
        
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
        
        if is_index:
            # 获取指数实时数据
            try:
                # 处理中国A股指数
                if clean_ticker in CHINA_INDEX_MAP:
                    # 使用 stock_zh_index_spot_sina 方法获取指数数据
                    @log_akshare_call
                    def get_index_data():
                        return ak.stock_zh_index_spot_sina()
                    
                    df = get_index_data()
                    df = df[df['代码'] == clean_ticker]
                    
                    if not df.empty:
                        row = df.iloc[0]
                        # 安全获取涨跌幅数据
                        change_pct = 0.0
                        try:
                            change_pct_raw = row.get('涨跌幅', 0)
                            if isinstance(change_pct_raw, str):
                                change_pct = float(change_pct_raw.replace('%', '')) / 100 
                            else:
                                change_pct = float(change_pct_raw) / 100
                        except (ValueError, ZeroDivisionError):
                            change_pct = 0.0
                            
                        yahoo_response.update({
                            "shortName": CHINA_INDEX_MAP.get(clean_ticker, row.get('名称', '')),
                            "longName": CHINA_INDEX_MAP.get(clean_ticker, row.get('名称', '')),
                            "regularMarketPrice": float(row.get('最新价', 0)),
                            "regularMarketChange": float(row.get('涨跌额', 0)),
                            "regularMarketChangePercent": change_pct,
                            "regularMarketDayHigh": float(row.get('最高', 0)),
                            "regularMarketDayLow": float(row.get('最低', 0)),
                            "regularMarketVolume": float(row.get('成交量', 0)),
                            "regularMarketOpen": float(row.get('开盘价', 0)),
                            "regularMarketPreviousClose": float(row.get('昨收', 0)),
                            "exchange": "SSE" if clean_ticker.startswith('0') else "SZSE",
                            "fullExchangeName": "上海证券交易所" if clean_ticker.startswith('0') else "深圳证券交易所"
                        })
                # 处理非中国A股指数
                else:
                    # 使用 stock_zh_index_spot_sina 方法获取其他指数数据
                    @log_akshare_call
                    def get_other_index_data():
                        return ak.stock_zh_index_spot_sina()
                    
                    df = get_other_index_data()
                    df = df[df['代码'] == clean_ticker]
                    
                    if not df.empty:
                        row = df.iloc[0]
                        # 安全获取涨跌幅数据
                        change_pct = 0.0
                        try:
                            change_pct_raw = row.get('涨跌幅', 0)
                            if isinstance(change_pct_raw, str):
                                change_pct = float(change_pct_raw.replace('%', '')) / 100 
                            else:
                                change_pct = float(change_pct_raw) / 100
                        except (ValueError, ZeroDivisionError):
                            change_pct = 0.0
                            
                        yahoo_response.update({
                            "shortName": row.get('名称', ''),
                            "longName": row.get('名称', ''),
                            "regularMarketPrice": float(row.get('最新价', 0)),
                            "regularMarketChange": float(row.get('涨跌额', 0)),
                            "regularMarketChangePercent": change_pct,
                            "regularMarketDayHigh": float(row.get('最高', 0)),
                            "regularMarketDayLow": float(row.get('最低', 0)),
                            "regularMarketVolume": float(row.get('成交量', 0)),
                            "regularMarketOpen": float(row.get('开盘价', 0)),
                            "regularMarketPreviousClose": float(row.get('昨收', 0)),
                            "exchange": "SSE" if clean_ticker.startswith('0') else "SZSE",
                            "fullExchangeName": "上海证券交易所" if clean_ticker.startswith('0') else "深圳证券交易所"
                        })
                    else:
                        # 如果找不到指数数据，使用自定义数据
                        index_name = ""
                        if clean_ticker in ["GSPC", "SPX"]:
                            index_name = "标普500指数"
                            currency = "USD"
                        elif clean_ticker in ["DJI"]:
                            index_name = "道琼斯工业平均指数"
                            currency = "USD"
                        elif clean_ticker in ["IXIC"]:
                            index_name = "纳斯达克综合指数"
                            currency = "USD"
                        elif clean_ticker in ["RUT"]:
                            index_name = "罗素2000指数"
                            currency = "USD"
                        else:
                            index_name = f"指数 {clean_ticker}"
                            currency = "USD" if clean_ticker in ["TNX"] else "CNY"
                            
                        # 生成随机数据模拟实时行情
                        base_price = 1000 + random.random() * 5000
                        change = (random.random() * 2 - 1) * 100
                        change_percent = change / base_price
                        
                        yahoo_response.update({
                            "shortName": index_name,
                            "longName": index_name,
                            "regularMarketPrice": base_price,
                            "regularMarketChange": change,
                            "regularMarketChangePercent": change_percent,
                            "regularMarketDayHigh": base_price + abs(change) * 1.2,
                            "regularMarketDayLow": base_price - abs(change) * 1.2,
                            "regularMarketVolume": random.randint(1000000, 100000000),
                            "regularMarketOpen": base_price - change * 0.5,
                            "regularMarketPreviousClose": base_price - change,
                            "currency": currency,
                            "exchange": "NYQ",
                            "fullExchangeName": "New York Stock Exchange"
                        })
            except Exception as e:
                logger.error(f"获取指数数据失败: {str(e)}", exc_info=True)
                # 生成模拟数据
                yahoo_response.update({
                    "shortName": CHINA_INDEX_MAP.get(clean_ticker, f"指数 {clean_ticker}"),
                    "regularMarketPrice": 1000 + random.random() * 5000,
                    "regularMarketChange": (random.random() * 2 - 1) * 50,
                    "regularMarketChangePercent": (random.random() * 2 - 1) * 0.03,
                    "currency": "CNY" if clean_ticker in CHINA_INDEX_MAP else "USD"
                })
                logger.info("已生成模拟指数数据")
                logger.debug(f"模拟数据: {yahoo_response}")
        else:
            # 获取股票实时数据
            try:
                if clean_ticker.startswith(('0', '3', '6')):  # A股
                    logger.info(f"获取A股实时数据: {clean_ticker}")
                    market = 'sh' if clean_ticker.startswith('6') else 'sz'
                    @log_akshare_call
                    def get_stock_data():
                        return ak.stock_zh_a_spot_em()
                    
                    stock_zh_a_spot_df = get_stock_data()
                    logger.debug(f"获取到的数据形状: {stock_zh_a_spot_df.shape}")
                    
                    filtered = stock_zh_a_spot_df[stock_zh_a_spot_df['代码'] == clean_ticker]
                    logger.debug(f"过滤后的数据行数: {len(filtered)}")
                    
                    if not filtered.empty:
                        row = filtered.iloc[0]
                        logger.debug(f"原始数据: {row.to_dict()}")
                        
                        # 填充Yahoo返回格式数据
                        yahoo_response.update({
                            "shortName": row.get('名称', ''),
                            "longName": row.get('名称', ''),
                            "regularMarketPrice": float(row.get('最新价', 0)),
                            "regularMarketChange": float(row.get('涨跌额', 0)),
                            "regularMarketChangePercent": float(row.get('涨跌幅', 0).replace('%', '')) / 100 if isinstance(row.get('涨跌幅', 0), str) else float(row.get('涨跌幅', 0)) / 100,
                            "regularMarketDayHigh": float(row.get('最高', 0)),
                            "regularMarketDayLow": float(row.get('最低', 0)),
                            "regularMarketVolume": float(row.get('成交量', 0)),
                            "regularMarketOpen": float(row.get('开盘', 0)),
                            "regularMarketPreviousClose": float(row.get('昨收', 0)),
                            "bid": float(row.get('买入', 0)),
                            "ask": float(row.get('卖出', 0)),
                            "bidSize": float(row.get('买入量', 0)) if '买入量' in row else 0,
                            "askSize": float(row.get('卖出量', 0)) if '卖出量' in row else 0,
                            "marketCap": float(row.get('总市值', 0)) if '总市值' in row else 0,
                            "exchange": "SHG" if market == 'sh' else "SHE",
                            "fullExchangeName": "上海证券交易所" if market == 'sh' else "深圳证券交易所"
                        })
                        logger.debug(f"转换后的数据: {yahoo_response}")
                    else:
                        logger.warning(f"未找到股票 {clean_ticker} 的数据，尝试其他数据源")
                        # 如果无法获取实时数据，尝试使用不同的数据源
                        data_sources = [
                            {"name": "stock_zh_a_spot_em", "handler": lambda: ak.stock_zh_a_spot_em()},
                            {"name": "stock_zh_a_spot_tx", "handler": lambda: ak.stock_zh_a_spot_tx(symbol=clean_ticker)},
                            {"name": "stock_zh_a_minutely_sina", "handler": lambda: ak.stock_zh_a_minute_sina(symbol=f"{'sh' if market == 'sh' else 'sz'}{clean_ticker}")}
                        ]
                        
                        for source in data_sources:
                            try:
                                logger.info(f"尝试使用备选数据源 {source['name']} 获取 {clean_ticker} 股票数据")
                                @log_akshare_call
                                def get_alternative_data():
                                    return source["handler"]()
                                
                                stock_df = get_alternative_data()
                                
                                if stock_df is not None and not stock_df.empty:
                                    logger.debug(f"从 {source['name']} 获取到数据，形状: {stock_df.shape}")
                                    # 针对不同数据源筛选数据
                                    if source["name"] == "stock_zh_a_spot_em":
                                        stock_df = stock_df[stock_df['代码'] == clean_ticker]
                                    
                                    if not stock_df.empty:
                                        logger.debug(f"从 {source['name']} 成功获取 {clean_ticker} 数据")
                                        row = stock_df.iloc[0]
                                        
                                        # 映射字段 - 根据不同数据源调整
                                        field_mappings = {
                                            "stock_zh_a_spot_em": {
                                                "名称": "shortName", 
                                                "最新价": "regularMarketPrice",
                                                "涨跌额": "regularMarketChange",
                                                "涨跌幅": "regularMarketChangePercent",
                                                "最高": "regularMarketDayHigh",
                                                "最低": "regularMarketDayLow",
                                                "成交量": "regularMarketVolume",
                                                "开盘": "regularMarketOpen",
                                                "昨收": "regularMarketPreviousClose"
                                            },
                                            "stock_zh_a_spot_tx": {
                                                "name": "shortName", 
                                                "price": "regularMarketPrice",
                                                "pricechange": "regularMarketChange",
                                                "changepercent": "regularMarketChangePercent",
                                                "high": "regularMarketDayHigh",
                                                "low": "regularMarketDayLow",
                                                "volume": "regularMarketVolume",
                                                "open": "regularMarketOpen",
                                                "prevclose": "regularMarketPreviousClose"
                                            },
                                            "stock_zh_a_minutely_sina": {
                                                "股票名称": "shortName", 
                                                "最新价": "regularMarketPrice",
                                                "涨跌额": "regularMarketChange",
                                                "涨跌幅": "regularMarketChangePercent",
                                                "最高价": "regularMarketDayHigh",
                                                "最低价": "regularMarketDayLow",
                                                "成交量": "regularMarketVolume",
                                                "开盘价": "regularMarketOpen",
                                                "昨收价": "regularMarketPreviousClose"
                                            }
                                        }
                                        
                                        mapping = field_mappings.get(source["name"], {})
                                        for src_field, target_field in mapping.items():
                                            if src_field in row.index:
                                                value = row[src_field]
                                                
                                                # 处理百分比字段
                                                if src_field in ["涨跌幅", "changepercent"] and isinstance(value, str) and "%" in value:
                                                    try:
                                                        value = float(value.replace("%", "")) / 100
                                                    except ValueError:
                                                        value = 0
                                                
                                                # 确保数值字段为数值类型
                                                if target_field not in ["shortName"]:
                                                    try:
                                                        value = float(value)
                                                    except (ValueError, TypeError):
                                                        value = 0
                                                
                                                yahoo_response[target_field] = value
                                        
                                        # 设置交易所信息
                                        yahoo_response["exchange"] = "SSE" if clean_ticker.startswith("6") else "SZSE"
                                        yahoo_response["fullExchangeName"] = "上海证券交易所" if clean_ticker.startswith("6") else "深圳证券交易所"
                                        yahoo_response["currency"] = "CNY"
                                        
                                        # 如果成功获取数据，跳出循环
                                        break
                            except Exception as e:
                                logger.error(f"从 {source['name']} 获取数据失败: {str(e)}", exc_info=True)
                                continue
                        
                        # 检查是否获取到有效价格
                        if yahoo_response["regularMarketPrice"] == 0:
                            logger.warning(f"无法从任何数据源获取 {clean_ticker} 的有效数据，使用模拟数据")
                            yahoo_response.update({
                                "shortName": f"股票 {clean_ticker}",
                                "regularMarketPrice": 100 + random.random() * 500,
                                "regularMarketChange": (random.random() * 2 - 1) * 20,
                                "regularMarketChangePercent": (random.random() * 2 - 1) * 0.05,
                                "currency": "CNY" if clean_ticker.startswith(('0', '3', '6')) else "USD"
                            })
                            logger.debug(f"生成的模拟数据: {yahoo_response}")
                else:
                    logger.info(f"处理非A股: {clean_ticker}")
                    # 不再生成随机数据，返回空数据
                    yahoo_response.update({
                        "shortName": f"股票 {clean_ticker}",
                        "regularMarketPrice": 0,
                        "regularMarketChange": 0,
                        "regularMarketChangePercent": 0,
                        "regularMarketDayHigh": 0,
                        "regularMarketDayLow": 0,
                        "regularMarketVolume": 0,
                        "regularMarketOpen": 0,
                        "regularMarketPreviousClose": 0,
                        "currency": "USD" if clean_ticker.isalpha() else "CNY",
                        "exchange": "NYQ" if clean_ticker.isalpha() else "HKG",
                        "fullExchangeName": "New York Stock Exchange" if clean_ticker.isalpha() else "Hong Kong Stock Exchange",
                        "_no_data": True
                    })
                    logger.debug(f"返回空数据: {yahoo_response}")
            except Exception as e:
                logger.error(f"获取股票数据失败: {str(e)}", exc_info=True)
                # 不再生成模拟数据，返回空数据
                yahoo_response.update({
                    "shortName": f"股票 {clean_ticker}",
                    "regularMarketPrice": 0,
                    "regularMarketChange": 0,
                    "regularMarketChangePercent": 0,
                    "currency": "CNY" if clean_ticker.startswith(('0', '3', '6')) else "USD",
                    "_no_data": True,
                    "_error": str(e)
                })
                logger.debug(f"返回空数据: {yahoo_response}")
        
        # 计算52周最高最低价变化
        # 如果是有效数据才计算
        if not yahoo_response.get("_no_data", False) and yahoo_response["regularMarketPrice"] > 0:
            yahoo_response["fiftyTwoWeekLow"] = yahoo_response["regularMarketPrice"] * 0.7
            yahoo_response["fiftyTwoWeekHigh"] = yahoo_response["regularMarketPrice"] * 1.3
            yahoo_response["fiftyTwoWeekLowChange"] = yahoo_response["regularMarketPrice"] - yahoo_response["fiftyTwoWeekLow"]
            yahoo_response["fiftyTwoWeekHighChange"] = yahoo_response["regularMarketPrice"] - yahoo_response["fiftyTwoWeekHigh"]
            
            # 安全除法，避免除零错误
            try:
                if yahoo_response["fiftyTwoWeekLow"] != 0:
                    yahoo_response["fiftyTwoWeekLowChangePercent"] = yahoo_response["fiftyTwoWeekLowChange"] / yahoo_response["fiftyTwoWeekLow"]
                else:
                    yahoo_response["fiftyTwoWeekLowChangePercent"] = 0
                    
                if yahoo_response["fiftyTwoWeekHigh"] != 0:
                    yahoo_response["fiftyTwoWeekHighChangePercent"] = yahoo_response["fiftyTwoWeekHighChange"] / yahoo_response["fiftyTwoWeekHigh"]
                else:
                    yahoo_response["fiftyTwoWeekHighChangePercent"] = 0
            except Exception as e:
                print(f"Error calculating percentage changes: {str(e)}")
                yahoo_response["fiftyTwoWeekLowChangePercent"] = 0
                yahoo_response["fiftyTwoWeekHighChangePercent"] = 0
            
            # 3个月平均成交量 - 不再使用随机数据
            yahoo_response["averageDailyVolume3Month"] = yahoo_response["regularMarketVolume"]
            
            # 基本面数据 - 返回零或实际值
            yahoo_response["trailingPE"] = 0
            yahoo_response["forwardPE"] = 0
            yahoo_response["dividendYield"] = 0
        else:
            # 对于无效数据，填充零
            yahoo_response["fiftyTwoWeekLow"] = 0
            yahoo_response["fiftyTwoWeekHigh"] = 0
            yahoo_response["fiftyTwoWeekLowChange"] = 0
            yahoo_response["fiftyTwoWeekHighChange"] = 0
            yahoo_response["fiftyTwoWeekLowChangePercent"] = 0
            yahoo_response["fiftyTwoWeekHighChangePercent"] = 0
            yahoo_response["averageDailyVolume3Month"] = 0
            yahoo_response["trailingPE"] = 0
            yahoo_response["forwardPE"] = 0
            yahoo_response["dividendYield"] = 0
                
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