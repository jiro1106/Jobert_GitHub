from __future__ import annotations

from typing import Any, List

from .connection import fetch_all, execute, get_connection


def row_to_dict(row) -> dict[str, Any]:
    if isinstance(row, dict):
        return row
    return dict(row) if row is not None else {}


def insert_crowdsourced_report(data: dict[str, Any]) -> int:
    """Insert a crowdsourced report - works with both Supabase and SQLite"""
    # Connection layer automatically handles Supabase vs SQLite
    
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
    # Connection layer automatically handles Supabase vs SQLite
    
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
    # Connection layer automatically handles Supabase vs SQLite
    
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