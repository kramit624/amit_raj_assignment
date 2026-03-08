# ── Dockerfile — backend ─────────────────────────────────────────────────────
# Build:   docker build -t sales-dashboard-backend .
# Run:     docker run -p 8000:8000 -v $(pwd)/data:/app/data sales-dashboard-backend

FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY backend/   ./backend/
COPY scripts/   ./scripts/
COPY data/raw/  ./data/raw/

# Create processed dir (bind-mounted at runtime, but must exist for builds)
RUN mkdir -p ./data/processed

# Run the full pipeline then start the API server
CMD ["sh", "-c", \
  "python scripts/clean_data.py && python scripts/analyze.py && uvicorn backend.main:app --host 0.0.0.0 --port 8000"]

EXPOSE 8000