from flask import render_template, Blueprint, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from models import User
from server import db


auth = Blueprint('auth', __name__)

@auth.route('/login-account')
def login():
  return render_template('login-account.html')

@auth.route('/login-account', methods=['POST'])
def login_post():
  email = request.form.get('email')
  password = request.form.get('password')
  remember = True if request.form.get('remember') else False

  user = User.query.filter_by(email=email).first()

  if not user or not check_password_hash(user.password, password):
    flash('Please check login details and try again.')
    return redirect(url_for('auth.login'))

  login_user(user, remember=remember)

  return redirect(url_for('public.profile'))

@auth.route('/create-account', methods=['GET'])
def signup():
  return render_template('create-account.html')

@auth.route('/create-account', methods=['POST'])
def signup_post():
  form = request.form

  name = form["username"]
  password = form["password1"]
  password_2 = form["password2"]
  email = form["email"]

  # Make sure user doesn't already exist

  user = User.query.filter_by(email=email).first()
  userName = User.query.filter_by(name=name).first()

  if user:
    flash('Email already exists.')
    return redirect(url_for('auth.signup'))

  if userName:
    flash('Username already exists.')
    return redirect(url_for('auth.signup'))

  new_user = User(email=email, name=name, password=generate_password_hash(password, method='sha256'))

  db.session.add(new_user)
  db.session.commit()

  flash('Account created! Please log in.')
  return redirect(url_for('auth.login'))

@auth.route('/logout')
@login_required
def logout():
  logout_user()
  return redirect(url_for('public.index'))
