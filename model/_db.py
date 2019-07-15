import sqlite3

db_file_rel_path = "./db/whale.db"


def db_connect():
    return sqlite3.connect(db_file_rel_path)
