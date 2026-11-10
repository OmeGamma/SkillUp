FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyMuPDF and document parsing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment
ENV PORT=8000
EXPOSE 8000

# Start server using dynamic cloud port ($PORT)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

