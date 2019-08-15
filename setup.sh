#!/bin/bash
mkdir -p tmp/db
sqlite3 tmp/db/whale.db < whale.db.schema