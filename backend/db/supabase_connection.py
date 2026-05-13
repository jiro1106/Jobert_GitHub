"""Supabase database connection using Supabase Python client"""
from typing import Any, Optional, List
from backend.config.settings import get_settings

settings = get_settings()

try:
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    SUPABASE_AVAILABLE = True
except Exception as e:
    print(f"Warning: Supabase client not available: {e}")
    SUPABASE_AVAILABLE = False


def get_supabase_client():
    """Get Supabase client instance"""
    if not SUPABASE_AVAILABLE:
        raise RuntimeError("Supabase client not initialized")
    return supabase


class SupabaseQuery:
    """Wrapper for Supabase queries to match connection.py interface"""
    
    @staticmethod
    def query(table: str, filters: dict = None) -> List[dict]:
        """Query a table from Supabase"""
        try:
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


def query_towers_near_bbox(min_lat: float, max_lat: float, min_lon: float, max_lon: float) -> List[dict]:
    """Query cell towers within a bounding box"""
    try:
        response = (
            supabase.table("cell_towers")
            .select("*")
            .gte("latitude", min_lat)
            .lte("latitude", max_lat)
            .gte("longitude", min_lon)
            .lte("longitude", max_lon)
            .execute()
        )
        return response.data if hasattr(response, 'data') else []
    except Exception as e:
        print(f"Supabase tower query error: {e}")
        return []

