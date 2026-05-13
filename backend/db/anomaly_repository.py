from __future__ import annotations

from typing import Any

from .connection import fetch_all


def insert_anomaly_log(data: dict[str, Any]) -> int:
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
    return [dict(row) for row in rows]


def get_anomalies_near_point(latitude: float, longitude: float, radius_km: float) -> list[dict[str, Any]]:
    from ..services.tower_matching_service import build_bbox_around_point

    min_latitude, min_longitude, max_latitude, max_longitude = build_bbox_around_point(latitude, longitude, radius_km)
    return get_anomalies_in_bbox(min_latitude, min_longitude, max_latitude, max_longitude)


def get_recent_anomalies(limit: int = 20) -> list[dict[str, Any]]:
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
    return [dict(row) for row in rows]