from __future__ import annotations

from typing import Any, Iterable, List

from .connection import execute, execute_many, fetch_all, fetch_one


def row_to_dict(row) -> dict[str, Any]:
    if isinstance(row, dict):
        d = dict(row)
    elif row is not None:
        d = dict(row)
    else:
        d = {}
    # DB column is `net` (OpenCellID MNC); tower_matching uses `mnc`
    if d.get("mnc") is None and d.get("net") is not None:
        d["mnc"] = d["net"]
    return d


def get_towers_near_point(latitude: float, longitude: float, radius_km: float) -> list[dict[str, Any]]:
    from ..services.tower_matching_service import build_bbox_around_point

    min_latitude, min_longitude, max_latitude, max_longitude = build_bbox_around_point(latitude, longitude, radius_km)
    return get_towers_in_bbox(min_latitude, min_longitude, max_latitude, max_longitude)


def get_towers_in_bbox(
    min_latitude: float,
    min_longitude: float,
    max_latitude: float,
    max_longitude: float,
) -> list[dict[str, Any]]:
    """Get towers within a bounding box - uses Supabase or SQLite"""
    from .supabase_connection import _initialize_supabase, SUPABASE_AVAILABLE, query_towers_near_bbox

    _initialize_supabase()
    if SUPABASE_AVAILABLE:
        rows = query_towers_near_bbox(
            min_latitude, max_latitude, min_longitude, max_longitude
        )
        return [row_to_dict(r) for r in rows]

    query = """
    SELECT
        tower_id,
        raw_cell_id,
        radio,
        mcc,
        net,
        provider_name,
        area,
        cell,
        unit,
        latitude,
        longitude,
        range_meters,
        samples,
        changeable,
        created,
        updated,
        average_signal,
        imported_at
    FROM cell_towers
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?;
    """
    rows = fetch_all(query, (min_latitude, max_latitude, min_longitude, max_longitude))
    return [row_to_dict(row) for row in rows]


def insert_tower(tower: dict[str, Any]) -> bool:
    """Insert a single tower"""
    # Connection layer automatically handles Supabase vs SQLite
    query = """
    INSERT INTO cell_towers (
        raw_cell_id, radio, mcc, net, provider_name, area, cell, unit,
        latitude, longitude, range_meters, samples, changeable, created, updated, average_signal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        tower.get("raw_cell_id"),
        tower.get("radio"),
        tower.get("mcc"),
        tower.get("net"),
        tower.get("provider_name"),
        tower.get("area"),
        tower.get("cell"),
        tower.get("unit"),
        tower.get("latitude"),
        tower.get("longitude"),
        tower.get("range_meters"),
        tower.get("samples"),
        tower.get("changeable"),
        tower.get("created"),
        tower.get("updated"),
        tower.get("average_signal"),
    )
    return execute(query, params)


def insert_towers(towers: list[dict[str, Any]]) -> bool:
    """Insert multiple towers"""
    # Connection layer automatically handles Supabase vs SQLite
    query = """
    INSERT INTO cell_towers (
        raw_cell_id, radio, mcc, net, provider_name, area, cell, unit,
        latitude, longitude, range_meters, samples, changeable, created, updated, average_signal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    rows = [
        (
            t.get("raw_cell_id"),
            t.get("radio"),
            t.get("mcc"),
            t.get("net"),
            t.get("provider_name"),
            t.get("area"),
            t.get("cell"),
            t.get("unit"),
            t.get("latitude"),
            t.get("longitude"),
            t.get("range_meters"),
            t.get("samples"),
            t.get("changeable"),
            t.get("created"),
            t.get("updated"),
            t.get("average_signal"),
        )
        for t in towers
    ]
    return execute_many(query, rows)


def delete_all_cell_towers() -> None:
    execute("DELETE FROM cell_towers;")


def insert_cell_towers_batch(rows: Iterable[tuple[Any, ...]]) -> None:
    query = """
    INSERT INTO cell_towers (
        raw_cell_id,
        radio,
        mcc,
        net,
        provider_name,
        area,
        cell,
        unit,
        latitude,
        longitude,
        range_meters,
        samples,
        changeable,
        created,
        updated,
        average_signal
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    execute_many(query, rows)


def count_cell_towers() -> int:
    row = fetch_one("SELECT COUNT(*) AS total FROM cell_towers;")
    return int(row["total"]) if row is not None else 0


def replace_all_towers(towers: Iterable[dict[str, Any]]) -> int:
    rows = [
        (
            tower.get("raw_cell_id"),
            tower.get("radio"),
            tower.get("mcc"),
            tower.get("net"),
            tower.get("provider_name"),
            tower.get("area"),
            tower.get("cell"),
            tower.get("unit"),
            tower["latitude"],
            tower["longitude"],
            tower.get("range_meters"),
            tower.get("samples"),
            tower.get("changeable"),
            tower.get("created"),
            tower.get("updated"),
            tower.get("average_signal"),
        )
        for tower in towers
        if tower.get("latitude") is not None and tower.get("longitude") is not None
    ]

    delete_all_cell_towers()
    if rows:
        insert_cell_towers_batch(rows)
    return len(rows)


def fetch_towers_by_ids(tower_ids: Iterable[int]) -> list[dict[str, Any]]:
    tower_ids = list(dict.fromkeys(tower_ids))
    if not tower_ids:
        return []

    placeholders = ", ".join("?" for _ in tower_ids)
    query = f"SELECT * FROM cell_towers WHERE tower_id IN ({placeholders});"
    rows = fetch_all(query, tuple(tower_ids))
    return [row_to_dict(row) for row in rows]