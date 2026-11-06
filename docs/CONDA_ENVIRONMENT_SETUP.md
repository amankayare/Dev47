# Python Environment Setup

The backend uses `uv` to manage its Python environment and locked dependencies.

## Prerequisites

- Python 3.9+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)

## Install Dependencies

From the repository root:

```bash
npm run install:server
```

Or directly:

```bash
cd server
uv sync
```

## Run the Backend

From the repository root:

```bash
npm run dev:server
```

Or directly from `server/`:

```bash
uv run python app.py
```

`uv run` uses the project's locked environment and keeps the backend
independent of a separately activated Conda environment.
