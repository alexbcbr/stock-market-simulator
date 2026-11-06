"""SQLite access for the Python trade backend.

Every repository opens its own short-lived connection through get_connection().
The schema is not created here: build the database first from ``ddl/*.sql``
(``make create-db``), otherwise queries fail with "no such table".

Attributes:
    DB_PATH: Location of the database file, ``data/market_stock.db`` at the
        repository root. Fixed at import time; there is no environment override.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "market_stock.db"


def get_connection():
    """Open a new SQLite connection to the market database.

    Use it as ``with get_connection() as conn``. The context manager commits on
    success and rolls back on an exception, but it does not close the connection;
    the connection is released when it is garbage collected.

    Foreign keys are switched on for each connection (SQLite leaves them off by
    default), so a trade for an unknown symbol, or deleting a symbol that trades
    reference, is rejected with ``sqlite3.IntegrityError``.

    Returns:
        sqlite3.Connection: Connection whose rows can be read by column name.

    Raises:
        sqlite3.OperationalError: If the ``data/`` directory is missing, so the
            file cannot be opened. An empty file is created if only the file is
            missing.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
