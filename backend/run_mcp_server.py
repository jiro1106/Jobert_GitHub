#!/usr/bin/env python3

import sys
from pathlib import Path

# Add backend parent directory to path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.mcp_server.server import main

if __name__ == "__main__":
    main()
