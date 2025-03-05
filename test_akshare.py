import akshare as ak
from datetime import datetime, timedelta

print("akshare版本:", ak.__version__)

# 测试东方财富分钟数据API
print("\n测试东方财富分钟数据API:")
now = datetime.now()
start_date = (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
end_date = now.strftime('%Y-%m-%d %H:%M:%S')
print(f'开始时间: {start_date}, 结束时间: {end_date}')

try:
    data = ak.stock_zh_a_hist_min_em(symbol='600519', period='1', start_date=start_date, end_date=end_date)
    print(f'获取到的数据行数: {len(data) if data is not None else 0}')
    print(f'列名: {list(data.columns) if data is not None else None}')
    print(data.head(3) if data is not None and len(data) > 0 else '无数据')
except Exception as e:
    print(f'错误: {e}')

# 测试新浪分钟数据API
print("\n测试新浪分钟数据API:")
try:
    data = ak.stock_zh_a_minute_sina(symbol='sh600519')
    print(f'获取到的数据行数: {len(data) if data is not None else 0}')
    print(f'列名: {list(data.columns) if data is not None else None}')
    print(data.head(3) if data is not None and len(data) > 0 else '无数据')
except Exception as e:
    print(f'错误: {e}') 