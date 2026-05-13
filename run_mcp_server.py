#!/usr/bin/env python3

import sys
from pathlib import Path

# add project root to path
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.mcp_server.server import main

if __name__ == "__main__":
    main()
