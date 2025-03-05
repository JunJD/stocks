import akshare as ak
from datetime import datetime, timedelta
import pandas as pd

print("akshare版本:", ak.__version__)

# 设置日期范围
now = datetime.now()
start_date = (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
end_date = now.strftime('%Y-%m-%d %H:%M:%S')
print(f'时间范围: {start_date} 至 {end_date}')

# 测试函数列表
test_functions = [
    {
        "name": "stock_zh_a_hist_min_em", 
        "func": lambda: ak.stock_zh_a_hist_min_em(symbol="600519", period="1", start_date=start_date, end_date=end_date),
        "desc": "东方财富股票分钟数据(贵州茅台)"
    },
    {
        "name": "stock_zh_a_minute", 
        "func": lambda: ak.stock_zh_a_minute(symbol="sh600519"),
        "desc": "A股分钟数据(贵州茅台)"
    },
    {
        "name": "index_zh_a_hist_min_em", 
        "func": lambda: ak.index_zh_a_hist_min_em(symbol="000300", period="1", start_date=start_date, end_date=end_date),
        "desc": "东方财富指数分钟数据(沪深300)"
    }
]

# 执行测试
for test in test_functions:
    print(f"\n测试 {test['name']} - {test['desc']}:")
    try:
        data = test["func"]()
        if data is not None and not data.empty:
            print(f"获取到的数据行数: {len(data)}")
            print(f"列名: {list(data.columns)}")
            print("数据预览:")
            print(data.head(3))
        else:
            print("获取数据为空")
    except Exception as e:
        print(f"错误: {e}") 