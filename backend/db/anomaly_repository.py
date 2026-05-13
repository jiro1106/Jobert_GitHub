from __future__ import annotations

from typing import Any, List

from .connection import fetch_all, execute, USE_SUPABASE


def insert_anomaly_log(data: dict[str, Any]) -> int:
    """Insert an anomaly log - works with both Supabase and SQLite"""
    
    if USE_SUPABASE:
        anomaly_data = {
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "provider_name": data.get("provider_name"),
            "predicted_score": data.get("predicted_score"),
            "reported_feedback": data.get("reported_feedback"),
            "anomaly_type": data.get("anomaly_type"),
            "explanation": data.get("explanation"),
        }
        try:
            success = execute(table="anomaly_logs", data=anomaly_data)
            return 1 if success else 0
        except Exception as e:
            if "could not find the table" in str(e).lower() or "pgrst205" in str(e):
                print(f"ERROR: anomaly_logs table not found in Supabase. Run: python db/init_supabase.py")
            else:
                print(f"Supabase insert error for anomaly_logs: {e}")
            return 0
    else:
        # SQLite
        from .connection import get_connection
        
        query = """
        INSERT INTO anomaly_logs (
            latitude,
            longitude,
            provider_name,
            predicted_score,
            reported_feedback,
            anomaly_type,
            explanation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """

        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(
                query,
                (
                    data["latitude"],
                    data["longitude"],
                    data.get("provider_name"),
                    data.get("predicted_score"),
                    data.get("reported_feedback"),
                    data.get("anomaly_type"),
                    data.get("explanation"),
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)
        except Exception:
            connection.rollback()
            raise
        finally:
            cursor.close()
            connection.close()


def get_anomalies_in_bbox(
    min_latitude: float,
    min_longitude: float,
    max_latitude: float,
    max_longitude: float,
) -> list[dict[str, Any]]:
    """Get anomalies in bounding box"""
    
    if USE_SUPABASE:
        try:
            from supabase import create_client
            from config.settings import get_settings
            settings = get_settings()
            supabase = create_client(settings.supabase_url, settings.supabase_key)
            
            response = (
                supabase.table("anomaly_logs")
                .select("*")
                .gte("latitude", min_latitude)
                .lte("latitude", max_latitude)
                .gte("longitude", min_longitude)
                .lte("longitude", max_longitude)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data if hasattr(response, 'data') else []
        except Exception as e:
            # If table doesn't exist, return empty list instead of crashing
            if "could not find the table" in str(e).lower() or "pgrst205" in str(e):
                print(f"Note: anomaly_logs table not found in Supabase. Run: python db/init_supabase.py")
                return []
            print(f"Error querying Supabase anomalies: {e}")
            return []
    else:
        # SQLite
        query = """
        SELECT
            anomaly_id,
            latitude,
            longitude,
            provider_name,
            predicted_score,
            reported_feedback,
            anomaly_type,
            explanation,
            created_at
        FROM anomaly_logs
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
        ORDER BY created_at DESC;
        """

        rows = fetch_all(query, (min_latitude, max_latitude, min_longitude, max_longitude))
        return [dict(row) if hasattr(row, '__getitem__') else row for row in rows]


def get_anomalies_near_point(latitude: float, longitude: float, radius_km: float) -> list[dict[str, Any]]:
    from ..services.tower_matching_service import build_bbox_around_point

    min_latitude, min_longitude, max_latitude, max_longitude = build_bbox_around_point(latitude, longitude, radius_km)
    return get_anomalies_in_bbox(min_latitude, min_longitude, max_latitude, max_longitude)


def get_recent_anomalies(limit: int = 20) -> list[dict[str, Any]]:
    """Get recent anomalies"""
    
    if USE_SUPABASE:
        try:
            from supabase import create_client
            from config.settings import get_settings
            settings = get_settings()
            supabase = create_client(settings.supabase_url, settings.supabase_key)
            
            response = (
                supabase.table("anomaly_logs")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data if hasattr(response, 'data') else []
        except Exception as e:
            # If table doesn't exist, return empty list instead of crashing
            if "could not find the table" in str(e).lower() or "pgrst205" in str(e):
                print(f"Note: anomaly_logs table not found in Supabase. Run: python db/init_supabase.py")
                return []
            print(f"Error querying Supabase recent anomalies: {e}")
            return []
    else:
        # SQLite
        query = """
        SELECT
            anomaly_id,
            latitude,
            longitude,
            provider_name,
            predicted_score,
            reported_feedback,
            anomaly_type,
            explanation,
            created_at
        FROM anomaly_logs
        ORDER BY created_at DESC
        LIMIT ?;
        """

        rows = fetch_all(query, (limit,))
        return [dict(row) if hasattr(row, '__getitem__') else row for row in rows]