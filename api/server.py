#!/usr/bin/python3

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import json
import logging

from . import lib
from . import robin

app = Flask(__name__)
CORS(app)


def res(what):
    return jsonify(what)


def success(what):
    return res({'res': True, 'data': what})


def failure(what):
    return res({'res': False, 'data': what})


@app.route('/yesterday')
def yesterday():
    return success(robin.get_yesterday('ticker, open, close'))


if __name__ == '__main__':
    app.run(port=4001)
