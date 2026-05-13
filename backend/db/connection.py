"""Database connection layer - prioritizes Supabase, falls back to SQLite."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Iterable, List, Optional

from .supabase_connection import (
    SupabaseQuery,
    get_supabase_client,
)

# SQLite fallback database path
DB_PATH = Path(__file__).resolve().parents[2] / "local_data.db"


def _is_supabase_available() -> bool:
    """
    Checks if Supabase is available.

    Do not rely only on imported SUPABASE_AVAILABLE because imported booleans
    can become stale after initialization.
    """
    try:
        get_supabase_client()
        return True
    except Exception:
        return False


USE_SUPABASE = _is_supabase_available()


def get_connection():
    """
    Get database connection.

    Supabase mode:
        returns Supabase client.

    SQLite mode:
        returns sqlite3 connection.

    Warning:
        Code that calls get_connection().cursor() only works in SQLite mode.
        Prefer fetch_all, fetch_one, execute, and execute_many in repositories.
    """
    if USE_SUPABASE:
        return get_supabase_client()

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")

    return connection


def fetch_all(
    query: str = "",
    params: tuple = (),
    table: str = "cell_towers",
    filters: dict[str, Any] | None = None,
) -> List[Any]:
    """
    Fetch all records.

    Supabase:
        Uses table + filters.

    SQLite:
        Uses raw SQL query + params.
    """
    if USE_SUPABASE:
        return SupabaseQuery.query(table, filters or {})

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def fetch_one(
    query: str = "",
    params: tuple = (),
    table: str = "cell_towers",
    filters: dict[str, Any] | None = None,
) -> Optional[Any]:
    """
    Fetch one record.

    Supabase:
        Uses table + filters.
        Handles simple COUNT-style calls by returning {"total": count}.

    SQLite:
        Uses raw SQL query + params.
    """
    if USE_SUPABASE:
        normalized_query = query.strip().lower()

        if normalized_query.startswith("select count"):
            rows = SupabaseQuery.query(table, filters or {})
            return {"total": len(rows)}

        results = SupabaseQuery.query(table, filters or {})
        return results[0] if results else None

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(query, params)
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()


def execute(
    query: str = "",
    params: tuple = (),
    table: str = "",
    data: dict[str, Any] | None = None,
) -> bool:
    """
    Execute insert/update/delete.

    Supabase:
        Currently supports insert through table + data.

    SQLite:
        Executes raw SQL query + params.
    """
    if USE_SUPABASE:
        if not table or not data:
            return False

        result = SupabaseQuery.insert(table, data)
        return result is not None

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(query, params)
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print(f"Execute error: {error}")
        return False
    finally:
        cursor.close()
        connection.close()


def execute_many(
    query: str = "",
    rows: Iterable[tuple] | None = None,
    table: str = "",
    data_rows: List[dict[str, Any]] | None = None,
) -> bool:
    """
    Execute multiple inserts.

    Supabase:
        Uses table + data_rows.

    SQLite:
        Uses raw SQL query + iterable rows.
    """
    if USE_SUPABASE:
        if not table or not data_rows:
            return False

        success_count = SupabaseQuery.insert_many(table, data_rows)
        return success_count > 0

    if not rows:
        return False

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.executemany(query, rows)
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print(f"Execute many error: {error}")
        return False
    finally:
        cursor.close()
        connection.close()