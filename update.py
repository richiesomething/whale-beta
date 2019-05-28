#!/usr/bin/env python3
from api import lib
from api import alpha

lib.upgrade()
alpha.historical(["AAPL", "MSFT", "SNAP", "FB", "PEP", "KO", "TSLA", "XOM",
                  "AMZN", "WMT", "NFLX", "DIS", "GOOG", "BIDU", "V", "PYPL", "PM", "PLNT"])

alpha.historical([
    # Goldman sachs
    "GSLC", "GSEW",
    # Schwab broad market & large cap
    "SCHB", "SCHV",
    # DJIA ETF by SPDR
    "DIA",
    # NASDAQ ETF by Fidelity
    "ONEQ",
    # S&P 500 ETF by Vanguard & their broad market
    "VOO", "VTI",
    # Russell 2000 ETF by iShares
    "IWM"
])
