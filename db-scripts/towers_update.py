import sys
from pathlib import Path
from typing import Optional

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.scripts.update_towers import update_cell_towers_from_csv

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


def delete_all_cell_towers():
    raise RuntimeError("Use backend.db.tower_repository.delete_all_cell_towers for tower maintenance.")


if __name__ == "__main__":
    result = update_cell_towers_from_csv(
        "../515.csv",
        confirm_update=True
    )

    print("Cell tower update complete.")
    print(result)