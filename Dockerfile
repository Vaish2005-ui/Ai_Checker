FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Core source code
COPY src/ src/
COPY api.py .
COPY database.py .
COPY aws_config.py .
COPY logging_config.py .

# ML models as fallback (primary source is S3)
COPY models/ models/
COPY data/processed/ data/processed/

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
