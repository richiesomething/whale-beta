#!/bin/bash
mkdir -p db
sqlite3 db/whale.db < whale.db.schema
