"""Database connection layer - prioritizes Supabase, falls back to SQLite"""
import sqlite3
from pathlib import Path
from typing import Any, Iterable, Optional, List
from config.settings import get_settings

# Try to use Supabase if configured, fallback to SQLite
try:
    from .supabase_connection import get_supabase_client, SupabaseQuery
    settings = get_settings()
    USE_SUPABASE = bool(settings.supabase_url and settings.supabase_key)
except Exception as e:
    print(f"Note: Supabase not available, using SQLite: {e}")
    USE_SUPABASE = False

# SQLite fallback
DB_PATH = Path(__file__).resolve().parents[2] / "local_data.db"


def get_connection():
    """Get database connection - Supabase if available, SQLite otherwise"""
    if USE_SUPABASE:
        return get_supabase_client()
    else:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON;")
        return connection


def fetch_all(query: str = "", params: tuple = (), table: str = "cell_towers") -> List[Any]:
    """Fetch all records - automatically selects Supabase or SQLite"""
    if USE_SUPABASE:
        return SupabaseQuery.query(table, {})
    else:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()


def fetch_one(query: str = "", params: tuple = (), table: str = "cell_towers") -> Optional[Any]:
    """Fetch one record - automatically selects Supabase or SQLite"""
    if USE_SUPABASE:
        results = SupabaseQuery.query(table, {})
        return results[0] if results else None
    else:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(query, params)
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()


def execute(query: str = "", params: tuple = (), table: str = "", data: dict = None) -> bool:
    """Execute insert/update - automatically selects Supabase or SQLite"""
    if USE_SUPABASE:
        if not data or not table:
            return False
        result = SupabaseQuery.insert(table, data)
        return result is not None
    else:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(query, params)
            connection.commit()
            return True
        except Exception as e:
            connection.rollback()
            print(f"Execute error: {e}")
            return False
        finally:
            cursor.close()
            connection.close()


def execute_many(query: str = "", rows: Iterable[tuple] = None, table: str = "", data_rows: List[dict] = None) -> bool:
    """Execute multiple operations - automatically selects Supabase or SQLite"""
    if USE_SUPABASE:
        if not data_rows or not table:
            return False
        success_count = SupabaseQuery.insert_many(table, data_rows)
        return success_count > 0
    else:
        if not rows:
            return False
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.executemany(query, rows)
            connection.commit()
            return True
        except Exception as e:
            connection.rollback()
            print(f"Execute many error: {e}")
            return False
        finally:
            cursor.close()
            connection.close()