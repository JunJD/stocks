import logging
import os
from datetime import datetime

# 创建logs目录（如果不存在）
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# 生成日志文件名（按日期）
current_date = datetime.now().strftime("%Y-%m-%d")
log_file = os.path.join(log_dir, f"akshare_{current_date}.log")

# 创建日志格式器
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 创建文件处理器
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setFormatter(formatter)

# 创建控制台处理器
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

# 创建logger
def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # 避免重复添加处理器
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger

# 创建一个用于记录akshare调用的装饰器
def log_akshare_call(func):
    def wrapper(*args, **kwargs):
        logger = get_logger("akshare")
        logger.info(f"调用akshare函数: {func.__name__}")
        logger.debug(f"参数: args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"返回结果类型: {type(result)}")
            if hasattr(result, 'shape'):
                logger.debug(f"数据形状: {result.shape}")
            return result
        except Exception as e:
            logger.error(f"调用出错: {str(e)}", exc_info=True)
            raise
    return wrapper 