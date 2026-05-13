from __future__ import annotations

from typing import Any, List

from .connection import _use_supabase, fetch_all
from .supabase_connection import get_supabase_client


def insert_anomaly_log(data: dict[str, Any]) -> int:
    """Insert an anomaly log - works with both Supabase and SQLite"""
    if _use_supabase():
        try:
            client = get_supabase_client()
            row = {
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "provider_name": data.get("provider_name"),
                "predicted_score": data.get("predicted_score"),
                "reported_feedback": data.get("reported_feedback"),
                "anomaly_type": data.get("anomaly_type"),
                "explanation": data.get("explanation"),
            }
            result = client.table("anomaly_logs").insert([row]).execute()
            inserted = result.data[0] if result.data else {}
            return inserted.get("anomaly_id", 1)
        except Exception as e:
            print(f"Supabase insert_anomaly error: {e}")
            return 0

    # SQLite path
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
        return int(cursor.lastrowid) if hasattr(cursor, 'lastrowid') else 1
    except Exception as e:
        connection.rollback()
        print(f"Error inserting anomaly: {e}")
        return 0
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
    if _use_supabase():
        try:
            client = get_supabase_client()
            result = (
                client.table("anomaly_logs")
                .select("*")
                .gte("latitude", min_latitude)
                .lte("latitude", max_latitude)
                .gte("longitude", min_longitude)
                .lte("longitude", max_longitude)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Supabase get_anomalies_in_bbox error: {e}")
            return []

    # SQLite path
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
    if _use_supabase():
        try:
            client = get_supabase_client()
            result = (
                client.table("anomaly_logs")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Supabase get_recent_anomalies error: {e}")
            return []

    # SQLite path
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



def get_anomalies_in_bbox(
    min_latitude: float,
    min_longitude: float,
    max_latitude: float,
    max_longitude: float,
) -> list[dict[str, Any]]:
    """Get anomalies in bounding box"""
    # Connection layer automatically handles Supabase vs SQLite
    
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
    # Connection layer automatically handles Supabase vs SQLite
    
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