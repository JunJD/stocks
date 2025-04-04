"""
股票数据获取辅助模块
直接使用requests从东方财富获取数据，避免akshare的事件循环问题
"""
import requests
import pandas as pd
import time
import json
import re

def fetch_stock_zh_a_spot(count=100, page=1):
    """
    直接从东方财富获取A股实时行情数据，功能类似akshare的stock_zh_a_spot_em
    :param count: 每页获取的数据条数
    :param page: 页码，从1开始
    :return: pandas.DataFrame, total_count
    """
    timestamp = int(time.time() * 1000)
    url = "https://push2.eastmoney.com/api/qt/clist/get"
    params = {
        "np": "1",
        "fltt": "1",
        "invt": "2",
        "fs": "m:0 t:6,m:0 t:80,m:1 t:2,m:1 t:23,m:0 t:81 s:2048",
        "fields": "f12,f13,f14,f1,f2,f4,f3,f152,f5,f6,f7,f15,f18,f16,f17,f10,f8,f9,f23",
        "fid": "f3",
        "pn": str(page),
        "pz": str(count if count > 0 else 5000),  # 使用传入的count参数，如果为-1则获取大量数据
        "po": "1",
        "ut": "fa5fd1943c7b386f172d6893dbfba10b",
        "_": str(timestamp)
    }
    
    headers = {
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Pragma": "no-cache",
        "Referer": "https://quote.eastmoney.com/center/gridlist.html",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        r.raise_for_status()  # 如果状态码不是200，引发HTTPError异常
        
        # 打印返回的原始数据结构，以便调试
        print(f"API响应状态码: {r.status_code}")
        
        data_json = r.json()
        
        # 获取总数据量
        total_count = data_json.get("data", {}).get("total", 0)
        print(f"总数据量: {total_count}")
        
        # 检查是否有data字段和diff字段
        if not data_json.get("data", {}).get("diff"):
            print(f"API返回结构有问题: {json.dumps(data_json, ensure_ascii=False)[:200]}...")
            return pd.DataFrame(), 0
        
        # 获取数据记录
        diff_data = data_json["data"]["diff"]
        print(f"获取到 {len(diff_data)} 条记录")
        
        if not diff_data:
            return pd.DataFrame(), 0
            
        # 转换为DataFrame
        df = pd.DataFrame(diff_data)
        
        # 打印列名，帮助调试
        print(f"原始列名: {df.columns.tolist()}")
        
        # 字段映射表 (根据实际返回的字段调整)
        field_mapping = {
            'f12': '代码',
            'f13': '市场',
            'f14': '名称',
            'f1': '最新价',
            'f2': '涨跌额',
            'f3': '涨跌幅',
            'f4': '成交量',
            'f5': '成交额',
            'f6': '振幅',
            'f7': '换手率',
            'f8': '市盈率-动态',
            'f9': '市净率',
            'f10': '量比',
            'f15': '最高',
            'f16': '最低',
            'f17': '今开',
            'f18': '昨收',
            'f23': '涨速',
            'f152': '60日涨跌幅'
        }
        
        # 重命名列
        df.rename(columns=field_mapping, inplace=True)
        
        # 添加序号列
        df['序号'] = range(1, len(df) + 1)
        
        # 选择需要的列
        columns_to_select = [
            '序号', '代码', '名称', '最新价', '涨跌幅', '涨跌额', '成交量', '成交额', 
            '振幅', '最高', '最低', '今开', '昨收', '量比', '换手率', 
            '市盈率-动态', '市净率', '涨速', '60日涨跌幅'
        ]
        
        # 只选择存在的列
        existing_columns = [col for col in columns_to_select if col in df.columns]
        df = df[existing_columns]
        
        # 转换数据类型
        numeric_cols = [
            '最新价', '涨跌幅', '涨跌额', '成交量', '成交额', '振幅', '最高', '最低', 
            '今开', '昨收', '量比', '换手率', '市盈率-动态', '市净率', '涨速', '60日涨跌幅'
        ]
        
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # 添加任何可能缺失的列，以与akshare格式保持一致
        missing_cols = {
            '总市值': 0,
            '流通市值': 0,
            '5分钟涨跌': 0,
            '年初至今涨跌幅': 0
        }
        
        for col, default_val in missing_cols.items():
            if col not in df.columns:
                df[col] = default_val
        
        print(f"处理后DataFrame形状: {df.shape}")
        return df, total_count
        
    except Exception as e:
        print(f"获取东方财富数据失败: {str(e)}")
        # 如果请求失败，打印完整的堆栈跟踪以便调试
        import traceback
        traceback.print_exc()
        return pd.DataFrame(), 0

def fetch_stock_zdf_distribution():
    """
    直接从东方财富获取股票涨跌幅分布数据
    :return: dict 包含日期和涨跌幅分布数据
    """
    timestamp = int(time.time() * 1000)
    url = "https://push2ex.eastmoney.com/getTopicZDFenBu"
    params = {
        "cb": f"callbackdata{int(timestamp % 10000000)}",
        "ut": "7eea3edcaed734bea9cbfc24409ed989",
        "dpt": "wz.ztzt",
        "_": str(timestamp)
    }
    
    headers = {
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Pragma": "no-cache",
        "Referer": "https://quote.eastmoney.com/ztb/?from=center",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        r.raise_for_status()  # 如果状态码不是200，引发HTTPError异常
        
        # 打印返回的原始数据结构，以便调试
        print(f"API响应状态码: {r.status_code}")
        
        # 处理JSONP回调格式
        response_text = r.text
        json_str = re.search(r'callbackdata\d+\((.*)\);', response_text)
        
        if not json_str:
            print(f"无法从响应中提取JSON: {response_text[:200]}...")
            return {}
            
        data_json = json.loads(json_str.group(1))
        
        # 检查响应码
        if data_json.get("rc") != 0 or not data_json.get("data"):
            print(f"API返回错误: {json.dumps(data_json, ensure_ascii=False)[:200]}...")
            return {}
        
        # 获取日期和分布数据
        result = {
            "date": data_json["data"]["qdate"],
            "distribution": {}
        }
        
        # 处理分布数据
        for item in data_json["data"].get("fenbu", []):
            for k, v in item.items():
                result["distribution"][k] = v
        
        # 转换为更有意义的格式
        formatted_distribution = {}
        for k, v in result["distribution"].items():
            # 转换为数字键
            percent = int(k)
            if percent == 0:
                range_str = "持平(0%)"
            elif percent > 0:
                range_str = f"上涨{percent}%~{percent+1}%"
            else:
                range_str = f"下跌{abs(percent)}%~{abs(percent)+1}%"
            
            formatted_distribution[range_str] = v
        
        result["formatted_distribution"] = formatted_distribution
        
        # 计算涨跌家数统计
        up_count = sum(v for k, v in result["distribution"].items() if int(k) > 0)
        down_count = sum(v for k, v in result["distribution"].items() if int(k) < 0)
        flat_count = result["distribution"].get("0", 0)
        
        result["summary"] = {
            "up_count": up_count,
            "down_count": down_count,
            "flat_count": flat_count,
            "total_count": up_count + down_count + flat_count
        }
        
        print(f"获取到涨跌分布数据，日期: {result['date']}")
        return result
        
    except Exception as e:
        print(f"获取东方财富涨跌分布数据失败: {str(e)}")
        # 如果请求失败，打印完整的堆栈跟踪以便调试
        import traceback
        traceback.print_exc()
        return {} 