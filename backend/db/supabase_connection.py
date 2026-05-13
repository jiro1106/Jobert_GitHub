"""Supabase database connection using Supabase Python client."""

from __future__ import annotations

from typing import Any, List, Optional

from ..config.settings import get_settings

settings = get_settings()

supabase = None
SUPABASE_AVAILABLE = False


def _initialize_supabase():
    """
    Initializes and returns the Supabase client.

    Kept for compatibility because connection.py imports this function.
    """
    try:
        from supabase import create_client

        if not settings.supabase_url or not settings.supabase_key:
            raise RuntimeError("Missing Supabase URL or key.")

        return create_client(settings.supabase_url, settings.supabase_key)

    except Exception as error:
        print(f"Warning: Supabase client not available: {error}")
        return None


supabase = _initialize_supabase()
SUPABASE_AVAILABLE = supabase is not None


def get_supabase_client():
    """Get Supabase client instance."""
    if not SUPABASE_AVAILABLE or supabase is None:
        raise RuntimeError("Supabase client not initialized.")

    return supabase


class SupabaseQuery:
    """Wrapper for Supabase queries to match connection.py interface."""

    @staticmethod
    def query(table: str, filters: dict[str, Any] | None = None) -> List[dict]:
        """Query a table from Supabase."""
        if not SUPABASE_AVAILABLE or supabase is None:
            return []

        try:
            query_builder = supabase.table(table).select("*")

            if filters:
                for key, value in filters.items():
                    query_builder = query_builder.eq(key, value)

            response = query_builder.execute()
            return response.data if hasattr(response, "data") and response.data else []

        except Exception as error:
            print(f"Supabase query error for {table}: {error}")
            return []

    @staticmethod
    def insert(table: str, data: dict[str, Any]) -> Optional[dict]:
        """Insert a row into Supabase."""
        if not SUPABASE_AVAILABLE or supabase is None:
            return None

        try:
            response = supabase.table(table).insert([data]).execute()
            data_list = response.data if hasattr(response, "data") and response.data else []
            return data_list[0] if data_list else None

        except Exception as error:
            print(f"Supabase insert error for {table}: {error}")
            return None

    @staticmethod
    def insert_many(table: str, data_list: List[dict[str, Any]]) -> int:
        """Insert multiple rows into Supabase."""
        if not SUPABASE_AVAILABLE or supabase is None:
            return 0

        if not data_list:
            return 0

        try:
            response = supabase.table(table).insert(data_list).execute()
            return len(response.data) if hasattr(response, "data") and response.data else 0

        except Exception as error:
            print(f"Supabase insert_many error for {table}: {error}")
            return 0

    @staticmethod
    def update(table: str, data: dict[str, Any], filters: dict[str, Any]) -> bool:
        """Update rows in Supabase."""
        if not SUPABASE_AVAILABLE or supabase is None:
            return False

        try:
            query_builder = supabase.table(table).update(data)

            for key, value in filters.items():
                query_builder = query_builder.eq(key, value)

            query_builder.execute()
            return True

        except Exception as error:
            print(f"Supabase update error for {table}: {error}")
            return False

    @staticmethod
    def delete(table: str, filters: dict[str, Any]) -> bool:
        """Delete rows from Supabase."""
        if not SUPABASE_AVAILABLE or supabase is None:
            return False

        try:
            query_builder = supabase.table(table).delete()

            for key, value in filters.items():
                query_builder = query_builder.eq(key, value)

            query_builder.execute()
            return True

        except Exception as error:
            print(f"Supabase delete error for {table}: {error}")
            return False


def query_towers_near_bbox(
    min_latitude: float,
    max_latitude: float,
    min_longitude: float,
    max_longitude: float,
) -> list[dict[str, Any]]:
    """
    Fetch all towers inside a bbox from Supabase.

    Supabase/PostgREST commonly returns only 1000 rows by default.
    This paginates so Python receives the full candidate tower set.
    """

    if not SUPABASE_AVAILABLE or supabase is None:
        return []

    all_rows: list[dict[str, Any]] = []
    page_size = 1000
    start = 0

    while True:
        end = start + page_size - 1

        response = (
            supabase.table("cell_towers")
            .select(
                "tower_id, radio, mcc, net, area, cell, unit, "
                "longitude, latitude, range_meters, samples, "
                "changeable, created, updated, average_signal"
            )
            .gte("latitude", min_latitude)
            .lte("latitude", max_latitude)
            .gte("longitude", min_longitude)
            .lte("longitude", max_longitude)
            .order("tower_id", desc=False)
            .range(start, end)
            .execute()
        )

        rows = response.data if hasattr(response, "data") and response.data else []
        for row in rows:
            mcc = row.get("mcc")
            mnc = row.get("net")
            provider = "Unknown"
            if mcc == 515:
                if mnc in (1, 2, 88):
                    provider = "Globe"
                elif mnc in (3, 5, 11):
                    provider = "Smart"
                elif mnc == 66:
                    provider = "DITO"

            row["provider_name"] = provider
            all_rows.append(row)

        if len(rows) < page_size:
            break

        start += page_size

    return all_rows