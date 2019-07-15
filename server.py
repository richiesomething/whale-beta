import flask
import flask_cors
import flask_login

import whale
import static
import pages

import model.users


def init_flask_app():
    app = flask.Flask(__name__)
    app.secret_key = "hT0yRAvrQcGbKbJkVE3kAw"

    flask_cors.CORS(app)

    login_manager = flask_login.LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return model.users.User.get_from_id(user_id)

    return app


if __name__ == "__main__":
    def main():
        app = init_flask_app()

        whale.init()

        static.route(flask_app=app)
        pages.route(flask_app=app)

        app.run(debug=True)

    main()


# Commit messages:
# - Removed sqlite3 from requirements.txt (included in Python 2.5+)
# - Fixed a few typos that were preventing successful execution.
# - Integrated the 'objects' directory, eliminated redundant code in between.
# - Added basic sign-up and log-in features.


# TODO:
#  - Update README.md with more documentation, especially about different endpoints and what information can be expected
#    from each.
#  - Add log-out, remember me, and user-specific features.
#  - Make all the SQL queries injection-safe.

