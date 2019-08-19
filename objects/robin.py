#!/usr/bin/env python3
from Robinhood import Robinhood
import redis
import urllib
import time
import sys
import json
import pprint
import getpass

from . import lib
from . import db

my_trader = Robinhood()


def login(who=False, force=False):
    if not who:
        who = db.user['email']

    token = lib.r.hget('auth', who)
    db.user['email'] = who
    if not token or force:
        password = getpass.getpass()
        try:
            my_trader.login(username=who, password=password)

        except Exception as ex:
            raise ex
            print("Password incorrect. Please try again")
            login(who, force)

        token = my_trader.headers['Authorization']
        lib.r.hset('auth', who, token)
        print("Gathering history")
        dividends()
        my_history()
    else:
        myid = lib.r.hget('id', db.user['email'])
        if myid:
            db.user['id'] = myid
        my_trader.headers['Authorization'] = token


def getInstrument(url):
    key = url.split('/')[-2]
    res = lib.r.hget('inst', key)

    try:
        res = res.decode("utf-8")
    except BaseException:
        pass

    if not res:
        req = urllib.request.Request(url)

        with urllib.request.urlopen(req) as response:
            res = response.read()

            lib.r.hset('inst', key, res)

    resJson = json.loads(res)

    name = resJson['simple_name']

    if not name:
        name = resJson['name']

    db.insert('instruments', {
        'ticker': resJson['symbol'],
        'name': name
    })

    return res


def historical(instrumentList=['MSFT']):
    for instrument in instrumentList:
        try:
            data = my_trader.get_historical_quotes(instrument, 'day', 'week')
        except BaseException:
            login(force=True)
            return historical(instrumentList)

        duration = 60 * 24
        if data:
            for row in data['historicals']:
                db.insert('historical', {
                    'ticker': instrument,
                    'open': row['open_price'],
                    'close': row['close_price'],
                    'low': row['low_price'],
                    'high': row['high_price'],
                    'begin': row['begins_at'],
                    'duration': duration
                })


def inject(res):
    res['instrument'] = json.loads(getInstrument(res['instrument']))
    return res


def getquote(what):
    key = 's:{}'.format(what)
    res = lib.r.get(key)
    if not res:
        res = json.dumps(my_trader.get_quote(what))
        lib.r.set(key, res, 900)
    return json.loads(res)


def getuser(what):
    if 'id' not in db.user:
        myid = lib.r.hget('id', db.user['email'])

        if not myid and 'account' in what:
            myid = what['account'].split('/')[-2]
            lib.r.hset('id', db.user['email'], myid)
        db.user['id'] = myid

    return db.user['id']


def dividends(data=False):
    print("Dividends")
    if not data:
        tradeList = my_trader.dividends()
    else:
        tradeList = data

    for trade in tradeList['results']:
        db.insert('trades', {
            'user_id': getuser(trade),
            'side': 'dividend',
            'instrument': trade['instrument'].split('/')[-2],
            'quantity': trade['position'],
            'price': trade['rate'],
            'created': trade['paid_at'],
            'rbn_id': trade['id']
        })

    if tradeList['next']:
        data = my_trader.session.get(tradeList['next'])
        dividends(data.json())


def portfolio():
    pass


def my_history(data=False):
    if not data:
        tradeList = my_trader.order_history()
    else:
        tradeList = data

    if 'detail' in tradeList:
        lib.showError(tradeList['detail'])
        login(force=True)

    for trade in tradeList['results']:
        for execution in trade['executions']:

            try:
                db.insert('trades', {
                    'user_id': getuser(trade),
                    'side': trade['side'],
                    'instrument': trade['instrument'].split('/')[-2],
                    'quantity': execution['quantity'],
                    'price': execution['price'],
                    'created': execution['timestamp'],
                    'rbn_id': execution['id']
                })
            except BaseException:
                return

        inject(trade)

        print(
            "{} {:5s} {:6s}".format(
                trade['created_at'],
                trade['side'],
                trade['instrument']['symbol']))

    if tradeList['next']:
        data = my_trader.session.get(tradeList['next'])
        my_history(data.json())


def analyze():
    res = db.run(
        'select side,count(*),sum(quantity*price) from trades where user_id = ? group by side',
        (db.user['id'],
         )).fetchall()

    print(res)
    pass


def whoami():
    pprint.pprint(db.user)


def positions():
    positionList = my_trader.positions()
    tickerList = []
    computed = 0
    for position in positionList['results']:
        position['instrument'] = json.loads(
            getInstrument(position['instrument']))
        if float(position['quantity']) > 0:
            symbol = position['instrument']['symbol']
            res = getquote(symbol)
            # pprint.pprint(res)
            last_price = res['last_extended_hours_trade_price']
            if last_price is None:
                last_price = res['last_trade_price']

            computed += float(position['quantity']) * float(last_price)
            popularity = my_trader.get_popularity(symbol)

            print("{:30s} {:5s} {:5.0f} {:10} {}".format(
                position['instrument']['name'][:29], symbol, float(position['quantity']), last_price, popularity))

    return {'computed': computed, 'positions': positionList}


def get_yesterday(fields='*'):
    return db.run('select {} from historical group by ticker order by begin desc'.format(
        fields)).fetchall()
