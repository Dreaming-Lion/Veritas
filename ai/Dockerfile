# ai/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 시스템 의존성
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ make pkg-config \
    curl git \
    libpq-dev \
    default-libmysqlclient-dev \
    libjpeg62-turbo-dev zlib1g-dev libpng-dev libfreetype6-dev \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    libssl-dev libffi-dev \
    libxml2-dev libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
