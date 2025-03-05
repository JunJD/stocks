import akshare as ak

print("测试不同指数代码格式:")

# 测试不同的指数代码格式
test_symbols = ['000016', '000300', 'sh000016', 'sh000300']

for symbol in test_symbols:
    try:
        print(f"\n尝试 {symbol}:")
        data = ak.index_zh_a_hist_min_em(
            symbol=symbol, 
            period='1', 
            start_date='2025-03-05 00:00:00', 
            end_date='2025-03-06 00:00:00'
        )
        print(f"  - 成功，获取到 {len(data)} 条数据")
        if len(data) > 0:
            print(f"  - 列名: {list(data.columns)}")
            print(f"  - 样例数据:\n{data.head(2)}")
    except Exception as e:
        print(f"  - 错误: {e}")
        
# 尝试使用stock_zh_index_daily_em获取指数日线数据（作为参考）
print("\n尝试使用stock_zh_index_daily_em获取指数日线数据:")
try:
    data = ak.stock_zh_index_daily_em(symbol="000016")
    print(f"  - 成功，获取到 {len(data)} 条数据")
    if len(data) > 0:
        print(f"  - 列名: {list(data.columns)}")
        print(f"  - 样例数据:\n{data.head(2)}")
except Exception as e:
    print(f"  - 错误: {e}") 