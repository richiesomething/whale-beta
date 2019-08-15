import flask
import requests

import whale

import model
import model.users
from flask import flash, get_flashed_messages

#email imports and configs
#Serializer uses apps secret key
from mailgun import mailgun_func
from itsdangerous import URLSafeTimedSerializer
s = URLSafeTimedSerializer("hT0yRAvrQcGbKbJkVE3kAw")



def route(flask_app):

    @flask_app.route("/")
    def index():
        return flask.render_template("index.html")

    @flask_app.route("/create-account", methods=["GET", "POST"])
    def create_account():
        if flask.request.method == "GET":
            return flask.render_template("create-account.html", errors=[])
        else:
            assert flask.request.method == "POST"
            form = flask.request.form

            user_name = form["username"]
            password_1 = form["password1"]
            password_2 = form["password2"]
            email_id = form["email"]

            errors = []

            # Checking if the username is unique:
            with model.db_connect() as connection:
                if model.users.check_if_username_exists(connection, user_name):
                    errors.append(f"A user with the username '{user_name}' already exists. "
                                  f"Please try a different username.")

            if password_1 != password_2:
                errors.append(f"The two passwords you entered do not match. Please try re-entering them.")

            if errors:
                return flask.render_template("create-account.html", errors=errors)
            else:
                # Create the account.
                assert password_1 == password_2
                try:
                    with model.db_connect() as connection:
                        model.users.create_user(connection, user_name, email_id, password_1)
                except model.sqlite3.DatabaseError:
                    return flask.render_template(
                        "create-account.html",
                        errors=[
                            "A server error occurred. Please try creating your account again. "
                            "(Database insertion failed)."
                        ]
                    )
                # CREATE EMAIL TOKEN and Email it with 
                token = s.dumps(email_id)
                link = flask.url_for('confirm_email', token = token, _external=True)
                mailgun_func(email_id, link)
                flash("We\'ve sent a confirmation email to {} check your spam folder".format(email_id))
                return flask.redirect(flask.url_for('index'))
                
    
    # email confirmation route
    @flask_app.route("/email_confirm/<token>")
    def confirm_email(token):
        email_id = s.loads(token, max_age=300)
        with model.db_connect() as connection:
            model.users.confirm_user(connection, email_id)
        flash('User {} is confirmed'.format(email_id))
        
        return flask.redirect(flask.url_for('index'))
            

    @flask_app.route("/login-account", methods=["GET", "POST"])
    def login_account():
        if flask.request.method == "GET":
            return flask.render_template("login-account.html")
        else:
            assert flask.request.method == "POST"
            form = flask.request.form

            email_id = form["email"]
            password = form["password"]

            with model.db_connect() as connection:
                success, msg = model.users.try_login_user(connection, email_id, password)
                if success:
                    return flask.render_template_string("Success! Logged in {{ current_user.user_name }}.")
                else:
                    return flask.render_template("login-account.html", errors=[msg])

    @flask_app.route("/whale")
    def whale_page():
        game_id = whale.game.id
        room_id = whale.game.add_room()
        player_id = whale.game.add_player(room_id)
        return flask.render_template("whale.html", game_id=game_id, room_id=room_id, player_id=player_id)

    @flask_app.route("/questionnaire")
    def questionnaire():
        return flask.render_template("Survey.html")

