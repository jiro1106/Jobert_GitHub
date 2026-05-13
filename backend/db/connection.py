import sqlite3
from pathlib import Path
from typing import Any, Iterable

DB_PATH = Path(__file__).resolve().parents[2] / "local_data.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection

def fetch_all(query: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

def fetch_one(query: str, params: tuple[Any, ...] = ()) -> sqlite3.Row | None:
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(query, params)
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()

def execute(query: str, params: tuple[Any, ...] = ()) -> None:
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(query, params)
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

def execute_many(query: str, rows: Iterable[tuple[Any, ...]]) -> None:
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.executemany(query, rows)
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()