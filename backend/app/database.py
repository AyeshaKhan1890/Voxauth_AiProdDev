from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def _normalize(url: str) -> str:
    # Hosts give postgres:// or postgresql://; SQLAlchemy needs the driver named.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


_url = make_url(_normalize(get_settings().database_url))
_connect_args: dict = {}
_engine_kwargs: dict = {"pool_pre_ping": True}

if _url.get_backend_name() == "sqlite":
    # FastAPI runs our DB calls in a threadpool, so SQLite must allow that.
    _connect_args = {"check_same_thread": False}
    if _url.database and _url.database != ":memory:":
        Path(_url.database).parent.mkdir(parents=True, exist_ok=True)
else:
    # Hosted Postgres: recycle connections before the provider closes idle ones,
    # and avoid prepared statements, which break behind connection poolers.
    _connect_args = {"prepare_threshold": None}
    _engine_kwargs.update(pool_recycle=300, pool_size=5, max_overflow=5)

engine = create_engine(_url, connect_args=_connect_args, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    from . import models  # noqa: F401  (registers the tables on Base)

    Base.metadata.create_all(engine)