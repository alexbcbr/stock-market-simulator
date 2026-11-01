FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
COPY *.py ./

RUN uv sync --frozen --no-dev

EXPOSE 8088

CMD ["uv", "run", "python", "server.py"]
