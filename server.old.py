#!/usr/bin/python3

import flask
from flask_cors import CORS
from objects import robin, user, db

import logging
import hp
import whale
from flask_login import current_user, login_user, logout_user, LoginManager


app = flask.Flask(__name__)
app.secret_key = 'hT0yRAvrQcGbKbJkVE3kAw'       # TODO: (CRITICAL) CHANGE THIS BEFORE DEPLOYMENT.
CORS(app)

FORMAT = '%(asctime)-15s %(message)s'
logging.basicConfig(format=FORMAT, level=logging.DEBUG)
logger = logging.getLogger(__name__)
db.set_log(logger)

hp_server = hp.Server()
whale_game = hp.Game("whale", whale.Room)
login_manager = LoginManager()

assert hp_server.add_game(app, whale_game)


# Standard wrappers for api calls
def res(what):
    return jsonify(what)


def success(what):
    return res({'res': True, 'data': what})


def failure(what):
    return res({'res': False, 'data': what})
# }} // wrappers


# Static {{
# TODO: nginx should be doing the static stuff. This is stupid
@app.route("/js/<path:sub_path>")
def js(sub_path):
    return flask.send_from_directory("js/", sub_path)


@app.route("/css/<path:sub_path>")
def css(sub_path):
    return flask.send_from_directory("css/", sub_path)


@app.route("/img/<res>/<path:name>")
def img(res, name):
    if res == "svg":
        return flask.send_from_directory("img/svg", f"{name}.svg")
    elif res == "x1":
        return flask.send_from_directory("img/x1", f"{name}.png")
    elif res == "x2":
        return flask.send_from_directory("img/x2", f"{name}.png")
    else:
        # Default to 3x resolution for unknown 'res' strings:
        return flask.send_from_directory("img/x3", f"{name}.png")


@app.route("/font/<path:sub_path>")
def font(sub_path):
    return flask.send_from_directory("font", sub_path)


@app.route("/audio/<path:sub_path>")
def audio(sub_path):
    return flask.send_from_directory("audio", sub_path + ".ogg")

# }} //Static

# Templates {{
@app.route("/")
def index():
    return flask.render_template("whale-landing.html")


@app.route("/whale")
def whale_page():
    game_id = whale_game.id
    room_id = whale_game.add_room()
    player_id = whale_game.add_player(room_id)
    return flask.render_template("whale.html", game_id=game_id, room_id=room_id, player_id=player_id)

# }} //Templates

# Stock Stuff {{
@app.route('/yesterday')
def yesterday():
    return success(robin.get_yesterday('ticker, open, close'))

# }} //Stock Stuff


@login_manager.user_loader
def load_user(user_id):
    return user.User.get(user_id)


@app.route("/register", methods=['PUT', 'POST'])
def register():
  """
  Mostly jacked from https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-v-user-logins
  """
  if current_user.is_authenticated:
    pass
  else:
    # Todo: get the form
    # form = RegistrationForm()
    # if form.validate_on_submit():

    user = User(email)
    user.set_password(password)
    flash('Congratulations, you are now a registered user!')
    return redirect(url_for('login'))
  return render_template('register.html', title='Register', form=form)


@app.route("/login", methods=['PUT', 'POST'])
def login():
    # TODO: Implement this!
    pass


@app.route("/logout", methods=['PUT', 'POST'])
@login_required
def logout():
  logout_user()
  return success('logged out')


login_manager.init_app(app)
# app.run(debug=False, host="0.0.0.0")
app.run()


# TODO:
#  - Animation:
#    - Click animation (feedback)
#    - Page transitions
#  - Tracking a user:
#    - Server/DB integration
#    - Cookies
#    - Score persistence (account system)
#  - Gameplay:
#    - Two more levels

# Fixes:
#  - Got 'hover_on' and 'hover_off' working with correct hit-boxes.
#  - Refactored code and API.

# Tickets:
#  - Hosting 'getwhaled' for info or correcting the URL the button currently points at.

# TODO: (minor)
#  - Set fixed font sizes for font objects
#  - Add mouse-over functionality, change buttons' colors.
#  - Add suffices to denote whether position values are in grid, dip (device independent pixel), or pix form.

# Get questionList from the server again
# Dynamically lay out questionList based on how many there are. Try making them of fixed height.
# Set the 'click' colors from the server based on which choice is correct.
# Add an animation for instructions before questionList appear.

