from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
import whale
import static
import pages
import analytics

import model.users
import model.analytics

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['SECRET_KEY']='thisismysecretkey'
    app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///db.sqlite3'

    db.init_app(app)

    login_manager =  LoginManager()
    login_manager.login_view = 'pages.login'
    login_manager.init_app(app)

    from models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from pages import flask_app as flask_app_pages
    app.register_blueprint(flask_app_pages)

    return app


if __name__ == '__main__':
    def main():
        app = create_app()
        whale.init()
        whale.route(flask_app=app)
        app.run(debug=True, port=5001)

    main()



