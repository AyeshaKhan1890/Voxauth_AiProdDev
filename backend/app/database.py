from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


_url = make_url(get_settings().database_url)
_connect_args: dict = {}

if _url.get_backend_name() == "sqlite":
    # FastAPI runs our DB calls in a threadpool, so SQLite must allow that.
    _connect_args = {"check_same_thread": False}
    if _url.database and _url.database != ":memory:":
        Path(_url.database).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(_url, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    from . import models  # noqa: F401  (registers the tables on Base)

    Base.metadata.create_all(engine)