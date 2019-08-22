import sqlite3

import os
db_file_rel_path = "/tmp/db/whale.db"


def db_connect():
    return sqlite3.connect(db_file_rel_path)
