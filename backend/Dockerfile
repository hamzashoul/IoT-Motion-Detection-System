FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    paho-mqtt \
    sqlalchemy \
    aiofiles \
    python-jose[cryptography] \
    passlib[bcrypt] \
    python-multipart \
    bcrypt==4.0.1 \
    websockets \
    python-dotenv

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]