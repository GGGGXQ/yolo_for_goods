import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SQLALCHEMY_DATABASE_URL = "sqlite:///./goods.db"
PROJECT_NAME = "Goods"
API_V1_STR = "/goodsmanager"
HOST = "localhost"
PORT = 8088
BACKEND_CORS_ORIGINS = ["*"]
DEBUG_MODE = True

# redis
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_USERNAME = ""
REDIS_PASSWORD = ""
REDIS_DB = 3
REDIS_URL = f"redis://{REDIS_USERNAME}:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

ALGORITHM = "HS256"
SECRET_KEY = "04c2c380-5511-4e78-b176-3d5475dd3bce"
# logger
LOG_LEVEL = "DEBUG"
LOG_FILE_TYPE = "SizeRotating"
# -----EMAIL SETTINGS-----
SENDER_EMAIL = "19860599289@163.com"
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', 'dummy_key')
