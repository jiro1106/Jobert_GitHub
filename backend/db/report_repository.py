from __future__ import annotations

from typing import Any, List

from .connection import fetch_all, execute, USE_SUPABASE


def row_to_dict(row) -> dict[str, Any]:
    if isinstance(row, dict):
        return row
    return dict(row) if row is not None else {}


def insert_crowdsourced_report(data: dict[str, Any]) -> int:
    """Insert a crowdsourced report - works with both Supabase and SQLite"""
    
    if USE_SUPABASE:
        report_data = {
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "provider_name": data.get("provider_name"),
            "signal_feedback": data.get("signal_feedback"),
            "speed_feedback": data.get("speed_feedback"),
            "issue_type": data.get("issue_type"),
            "user_notes": data.get("user_notes"),
            "source_type": data.get("source_type", "user_report"),
        }
        try:
            success = execute(table="crowdsourced_reports", data=report_data)
            return 1 if success else 0
        except Exception as e:
            if "could not find the table" in str(e).lower() or "pgrst205" in str(e):
                print(f"ERROR: crowdsourced_reports table not found in Supabase. Run: python db/init_supabase.py")
            else:
                print(f"Supabase insert error for crowdsourced_reports: {e}")
            return 0
    else:
        # SQLite
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
            return int(cursor.lastrowid)
        except Exception:
            connection.rollback()
            raise
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
    
    if USE_SUPABASE:
        from .supabase_connection import query_towers_near_bbox
        try:
            from supabase import create_client
            from backend.config.settings import get_settings
            settings = get_settings()
            supabase = create_client(settings.supabase_url, settings.supabase_key)
            
            response = (
                supabase.table("crowdsourced_reports")
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
                print(f"Note: crowdsourced_reports table not found in Supabase. Run: python db/init_supabase.py")
                return []
            print(f"Error querying Supabase reports: {e}")
            return []
    else:
        # SQLite
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
    
    if USE_SUPABASE:
        try:
            from supabase import create_client
            from backend.config.settings import get_settings
            settings = get_settings()
            supabase = create_client(settings.supabase_url, settings.supabase_key)
            
            response = (
                supabase.table("crowdsourced_reports")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data if hasattr(response, 'data') else []
        except Exception as e:
            # If table doesn't exist, return empty list instead of crashing
            if "could not find the table" in str(e).lower() or "pgrst205" in str(e):
                print(f"Note: crowdsourced_reports table not found in Supabase. Run: python db/init_supabase.py")
                return []
            print(f"Error querying Supabase recent reports: {e}")
            return []
    else:
        # SQLite
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