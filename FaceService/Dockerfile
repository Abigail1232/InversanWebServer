FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates libglib2.0-0 libgl1 libstdc++6 \
	&& rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
	&& rm -rf /var/lib/apt/lists/* /root/.cache/pip
COPY scripts ./scripts
COPY models/README.md ./models/README.md
COPY models/licenses ./models/licenses
RUN python scripts/prepare_models.py
COPY app ./app
COPY tests ./tests

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
