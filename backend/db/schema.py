from __future__ import annotations

import sqlite3

from .connection import DB_PATH, get_connection

LEGACY_TABLES = (
    "current_route_sessions",
    "current_route_points",
    "current_closest_towers",
    "current_route_result",
    "saved_routes",
    "saved_route_points",
)

SCHEMA_STATEMENTS = (
    """
    CREATE TABLE IF NOT EXISTS cell_towers (
        tower_id INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_cell_id INTEGER,
        radio TEXT,
        mcc INTEGER,
        net INTEGER,
        provider_name TEXT,
        area INTEGER,
        cell INTEGER,
        unit INTEGER,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        range_meters REAL,
        samples INTEGER,
        changeable INTEGER,
        created INTEGER,
        updated INTEGER,
        average_signal INTEGER,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS crowdsourced_reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        provider_name TEXT,
        signal_feedback TEXT,
        speed_feedback TEXT,
        issue_type TEXT,
        user_notes TEXT,
        source_type TEXT DEFAULT 'user_report',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS anomaly_logs (
        anomaly_id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        provider_name TEXT,
        predicted_score REAL,
        reported_feedback TEXT,
        anomaly_type TEXT,
        explanation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_cell_towers_lat_lon
    ON cell_towers(latitude, longitude);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_cell_towers_provider
    ON cell_towers(provider_name);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_reports_lat_lon
    ON crowdsourced_reports(latitude, longitude);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_reports_provider
    ON crowdsourced_reports(provider_name);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_anomaly_lat_lon
    ON anomaly_logs(latitude, longitude);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_anomaly_provider
    ON anomaly_logs(provider_name);
    """,
)


def create_database(drop_legacy_tables: bool = False) -> None:
    """Create database schema - only needed for SQLite fallback"""
    from .connection import USE_SUPABASE
    
    if USE_SUPABASE:
        # Supabase tables should already exist
        print("Using Supabase - skipping local database setup")
        return
    
    connection = get_connection()
    cursor = connection.cursor()

    try:
        for statement in SCHEMA_STATEMENTS:
            cursor.execute(statement)

        if drop_legacy_tables:
            drop_legacy_schema(cursor)

        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def drop_legacy_schema(cursor: sqlite3.Cursor) -> None:
    for table_name in LEGACY_TABLES:
        cursor.execute(f"DROP TABLE IF EXISTS {table_name};")


def check_tables() -> None:
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT type, name
        FROM sqlite_master
        WHERE type IN ('table', 'index', 'trigger')
        ORDER BY type, name;
        """
    )
    objects = cursor.fetchall()

    print("\nDatabase objects:")
    for object_type, name in objects:
        print(f"- {object_type}: {name}")

    connection.close()