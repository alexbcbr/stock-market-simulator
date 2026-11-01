FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first so this layer is cached unless deps change.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

# Then copy the app source and install the project itself.
COPY app ./app
RUN uv sync --locked --no-dev

EXPOSE 8000

CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
