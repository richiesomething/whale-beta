#!/usr/bin/env python3
import redis
import time
import sys
import json
import sys

from . import robin
from . import lib

lib.upgrade()

if len(sys.argv) < 2:
    print("Login username required")
    sys.exit(0)
robin.login(sys.argv[1])
robin.historical(["AAPL",
                  "MSFT",
                  "SNAP",
                  "FB",
                  "PEP",
                  "KO",
                  "TSLA",
                  "XOM",
                  "AMZN",
                  "WMT",
                  "NFLX",
                  "DIS",
                  "GOOG",
                  "BIDU",
                  "V",
                  "PYPL",
                  "PM",
                  "PLNT"])


while True:
    print("> ", end="")
    cmd = input()
    eval("robin." + cmd)()
