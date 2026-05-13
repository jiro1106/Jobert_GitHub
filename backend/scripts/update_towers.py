from __future__ import annotations

import csv
from pathlib import Path
from typing import Optional

from ..db.tower_repository import replace_all_towers

PROVIDER_BY_NET = {
    2: "Globe",
    3: "Smart",
    66: "DITO",
}


def get_provider_name(net: Optional[int]) -> str:
    if net is None:
        return "Unknown"
    return PROVIDER_BY_NET.get(net, "Unknown")


def clean_int(value):
    if value is None or value == "":
        return None

    try:
        return int(float(value))
    except ValueError:
        return None


def clean_float(value):
    if value is None or value == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


def update_cell_towers_from_csv(csv_path: str | Path, confirm_update: bool = False):
    if not confirm_update:
        raise ValueError(
            "Refusing to update cell_towers. Call update_cell_towers_from_csv(csv_path, confirm_update=True)."
        )

    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    towers = []
    skipped_count = 0

    with csv_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            latitude = clean_float(row.get("lat"))
            longitude = clean_float(row.get("lon"))
            if latitude is None or longitude is None:
                skipped_count += 1
                continue

            net = clean_int(row.get("net"))
            towers.append(
                {
                    "raw_cell_id": clean_int(row.get("id")),
                    "radio": row.get("radio"),
                    "mcc": clean_int(row.get("mcc")),
                    "net": net,
                    "provider_name": get_provider_name(net),
                    "area": clean_int(row.get("area")),
                    "cell": clean_int(row.get("cell")),
                    "unit": clean_int(row.get("unit")),
                    "latitude": latitude,
                    "longitude": longitude,
                    "range_meters": clean_float(row.get("range")),
                    "samples": clean_int(row.get("samples")),
                    "changeable": clean_int(row.get("changeable")),
                    "created": clean_int(row.get("created")),
                    "updated": clean_int(row.get("updated")),
                    "average_signal": clean_int(row.get("averageSignal")),
                }
            )

    inserted_count = replace_all_towers(towers)
    return {
        "inserted_count": inserted_count,
        "skipped_count": skipped_count,
        "csv_path": str(csv_path),
    }


if __name__ == "__main__":
    result = update_cell_towers_from_csv(Path(__file__).resolve().parents[2] / "515.csv", confirm_update=True)
    print("Cell tower update complete.")
    print(result)