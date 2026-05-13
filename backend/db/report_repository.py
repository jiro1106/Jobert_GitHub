from __future__ import annotations

from typing import Any, List

from .connection import _use_supabase, fetch_all, execute
from .supabase_connection import get_supabase_client


def row_to_dict(row) -> dict[str, Any]:
    if isinstance(row, dict):
        return row
    return dict(row) if row is not None else {}


def insert_crowdsourced_report(data: dict[str, Any]) -> int:
    """Insert a crowdsourced report - works with both Supabase and SQLite"""
    if _use_supabase():
        try:
            client = get_supabase_client()
            row = {
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "provider_name": data.get("provider_name"),
                "signal_feedback": data.get("signal_feedback"),
                "speed_feedback": data.get("speed_feedback"),
                "issue_type": data.get("issue_type"),
                "user_notes": data.get("user_notes"),
                "source_type": data.get("source_type", "user_report"),
            }
            result = client.table("crowdsourced_reports").insert([row]).execute()
            inserted = result.data[0] if result.data else {}
            return inserted.get("report_id", inserted.get("eport_id", 1))
        except Exception as e:
            print(f"Supabase insert_report error: {e}")
            return 0

    # SQLite path
    from .connection import get_connection
    query = """
    INSERT INTO crowdsourced_reports (
        latitude,
        longitude,
        provider_name,
        signal_feedback,
        speed_feedback,
        issue_type,
        user_notes,
        source_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
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
                data.get("signal_feedback"),
                data.get("speed_feedback"),
                data.get("issue_type"),
                data.get("user_notes"),
                data.get("source_type", "user_report"),
            ),
        )
        connection.commit()
        return int(cursor.lastrowid) if hasattr(cursor, 'lastrowid') else 1
    except Exception as e:
        connection.rollback()
        print(f"Error inserting report: {e}")
        return 0
    finally:
        cursor.close()
        connection.close()


def insert_report(report: dict[str, Any]) -> int:
    return insert_crowdsourced_report(report)


def get_reports_in_bbox(
    min_latitude: float,
    min_longitude: float,
    max_latitude: float,
    max_longitude: float,
) -> list[dict[str, Any]]:
    """Get reports in bounding box"""
    if _use_supabase():
        try:
            client = get_supabase_client()
            result = (
                client.table("crowdsourced_reports")
                .select("*")
                .gte("latitude", min_latitude)
                .lte("latitude", max_latitude)
                .gte("longitude", min_longitude)
                .lte("longitude", max_longitude)
                .order("created_at", desc=True)
                .limit(500)
                .execute()
            )
            rows = result.data if result.data else []
            for row in rows:
                if "eport_id" in row:
                    row["report_id"] = row.pop("eport_id")
            return rows
        except Exception as e:
            print(f"Supabase get_reports_in_bbox error: {e}")
            return []

    # SQLite path
    query = """
    SELECT
        report_id,
        latitude,
        longitude,
        provider_name,
        signal_feedback,
        speed_feedback,
        issue_type,
        user_notes,
        source_type,
        created_at
    FROM crowdsourced_reports
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    ORDER BY created_at DESC;
    """
    rows = fetch_all(query, (min_latitude, max_latitude, min_longitude, max_longitude))
    return [row_to_dict(row) for row in rows]


def get_reports_near_point(latitude: float, longitude: float, radius_km: float) -> list[dict[str, Any]]:
    from ..services.tower_matching_service import build_bbox_around_point

    min_latitude, min_longitude, max_latitude, max_longitude = build_bbox_around_point(latitude, longitude, radius_km)
    return get_reports_in_bbox(min_latitude, min_longitude, max_latitude, max_longitude)


def get_recent_reports(limit: int = 20) -> list[dict[str, Any]]:
    """Get recent reports"""
    if _use_supabase():
        try:
            client = get_supabase_client()
            result = (
                client.table("crowdsourced_reports")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            rows = result.data if result.data else []
            for row in rows:
                if "eport_id" in row:
                    row["report_id"] = row.pop("eport_id")
            return rows
        except Exception as e:
            print(f"Supabase get_recent_reports error: {e}")
            return []

    # SQLite path
    query = """
    SELECT
        report_id,
        latitude,
        longitude,
        provider_name,
        signal_feedback,
        speed_feedback,
        issue_type,
        user_notes,
        source_type,
        created_at
    FROM crowdsourced_reports
    ORDER BY created_at DESC
    LIMIT ?;
    """
    rows = fetch_all(query, (limit,))
    return [row_to_dict(row) for row in rows]