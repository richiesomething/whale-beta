# Setting up

This game works off of an SQLite database which gets set up automatically by running `api / update.py`, which "updates" to the schema  found in `api / db.py` and then gets recent quotes to populate it.

Before you proceed however, you'll need [redis](https://redis.io) which maintains an http cache of the api results so we don't need to hit the server each time.

After that's installed and running you can run update.py as many times as you need. It won't put in duplicate records and the caching system will prevent you from naively hitting the api quota.

After this is done, you can run `whale - beta / server` (see README in root directory of repo).

# Design

The overall design of the games:

Mostly we are dealing with [SPAs](https: // en.wikipedia.org / wiki / Single - page_application) which use a light amount of non - frameworked javascript and standard html / css.

The server side is broken up into two parts:

    * A data aggregator that assembles stocks and quotes, placing them into the database

    * A flask server for serving these cached assets

Most of this is based on Brooks' [Plan one to throw away](http: // wiki.c2.com /?PlanToThrowOneAway) design along with [Tracer Bullets](https: // flylib.com / books / en / 1.315.1.25 / 1 /) from Hunt & Thomas.

This is to find the right[Product / Market Fit](https: // en.wikipedia.org / wiki / Product / market_fit) based on Andreesseen and Reid.

These games are ultimately simple with information gathering in them in order to get the right set of customers to do the right set of things


# Endpoints:

# Chatting


# Teams


# Playing


# Comparing


# User

# /me
# /register
# /login
# /portfolio/:user

# Sharing

# /users/:filter/:fields
# /follow/:user
# /bet
