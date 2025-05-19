FROM python:3.9-slim

WORKDIR /app

# install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# copy dependency files
COPY backend/requirements.txt .

# install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# copy application code
COPY backend/ .

# expose API port
EXPOSE 8000

# start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]