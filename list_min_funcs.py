import akshare as ak
import re

print("akshare版本:", ak.__version__)
print("\n股票分钟数据相关函数:")

available_funcs = [f for f in dir(ak) if re.search('(stock.*minute|stock.*min)', f)]
for func in available_funcs:
    print(f"- {func}")

print("\n指数分钟数据相关函数:")
index_funcs = [f for f in dir(ak) if re.search('(index.*minute|index.*min)', f)]
for func in index_funcs:
    print(f"- {func}") 