"""Supabase database connection using Supabase Python client"""
from typing import List, Optional

from ..config.settings import get_settings

# Lazy-initialized Supabase client
_supabase_client = None
SUPABASE_AVAILABLE = False


def _initialize_supabase():
    """Initialize Supabase client on first use"""
    global _supabase_client, SUPABASE_AVAILABLE
    
    if _supabase_client is not None:
        return _supabase_client
    
    try:
        from supabase import create_client
        settings = get_settings()
        
        if not settings.supabase_url or not settings.supabase_key:
            print("Note: Supabase credentials not configured, using SQLite fallback")
            SUPABASE_AVAILABLE = False
            return None
        
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
        SUPABASE_AVAILABLE = True
        print("✓ Successfully connected to Supabase")
        return _supabase_client
    except Exception as e:
        print(f"Warning: Supabase client not available: {e}")
        SUPABASE_AVAILABLE = False
        return None


def get_supabase_client():
    """Get Supabase client instance (lazy initialization)"""
    client = _initialize_supabase()
    if not client:
        raise RuntimeError("Supabase client not initialized")
    return client


class SupabaseQuery:
    """Wrapper for Supabase queries to match connection.py interface"""
    
    @staticmethod
    def query(table: str, filters: dict = None) -> List[dict]:
        """Query a table from Supabase"""
        try:
            supabase = get_supabase_client()
            query_builder = supabase.table(table).select("*")
            
            if filters:
                for key, value in filters.items():
                    query_builder = query_builder.eq(key, value)
            
            response = query_builder.execute()
            return response.data if hasattr(response, 'data') else []
        except Exception as e:
            print(f"Supabase query error for {table}: {e}")
            return []
    
    @staticmethod
    def query_with_sql(query: str, params: tuple = ()) -> List[dict]:
        """Execute custom SQL query via Supabase"""
        try:
            supabase = get_supabase_client()
            # Use RPC or raw query if available
            response = supabase.rpc("execute_query", {"query": query, "params": params}).execute()
            return response.data if hasattr(response, 'data') else []
        except Exception as e:
            print(f"Supabase SQL query error: {e}")
            return []
    
    @staticmethod
    def insert(table: str, data: dict) -> Optional[dict]:
        """Insert a row into Supabase"""
        try:
            supabase = get_supabase_client()
            response = supabase.table(table).insert([data]).execute()
            data_list = response.data if hasattr(response, 'data') else []
            return data_list[0] if data_list else None
        except Exception as e:
            print(f"Supabase insert error for {table}: {e}")
            return None
    
    @staticmethod
    def insert_many(table: str, data_list: List[dict]) -> int:
        """Insert multiple rows into Supabase"""
        try:
            supabase = get_supabase_client()
            response = supabase.table(table).insert(data_list).execute()
            return len(response.data) if hasattr(response, 'data') else 0
        except Exception as e:
            print(f"Supabase insert_many error for {table}: {e}")
            return 0
    
    @staticmethod
    def update(table: str, data: dict, filters: dict) -> bool:
        """Update rows in Supabase"""
        try:
            query_builder = supabase.table(table).update(data)
            
            for key, value in filters.items():
                query_builder = query_builder.eq(key, value)
            
            query_builder.execute()
            return True
        except Exception as e:
            print(f"Supabase update error for {table}: {e}")
            return False


def query_towers_near_bbox(
    min_latitude: float,
    max_latitude: float,
    min_longitude: float,
    max_longitude: float,
) -> list[dict]:
    """
    Fetch all towers inside a bbox from Supabase.

    Supabase/PostgREST often returns only 1000 rows by default.
    This paginates so Python receives the full candidate tower set.
    """

    all_rows = []
    page_size = 1000
    start = 0

    while True:
        end = start + page_size - 1

        response = (
            supabase
            .table("cell_towers")
            .select(
                "tower_id, radio, mcc, net, area, cell, unit, "
                "longitude, latitude, range_meters, samples, "
                "changeable, created, updated, average_signal"
            )
            .gte("latitude", min_latitude)
            .lte("latitude", max_latitude)
            .gte("longitude", min_longitude)
            .lte("longitude", max_longitude)
            .range(start, end)
            .execute()
        )

        rows = response.data or []
        all_rows.extend(rows)

        if len(rows) < page_size:
            break

        start += page_size

    return all_rows

