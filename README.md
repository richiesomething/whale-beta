This is the gaming graphics platform, not the platform for the company

## Infrastructure
- MySQL DB on the backend; see `db/` for init scripts + Python module interface.
- Flask/Jinja page rendering: `templates/` for style demos + pages, `static/js/*.ts` and `static/css/whale.css` for library code.
- Python Flask + SQLAlchemy hooks available for the backend, we're ready to start writing pages.
```
Please speak to @Thundersnail before changing any database stuff.
```

## Demo
- See Slack #gamedevelopment group chat.


##instruction
from terminal in 1 directory up run: 
python3
>>>from appName import db, create_app
>>>db.create_all(app=create_app)

run commands:
export FLASK_APP=appName
#doesnt work if ap name has '-'
#changed it on my computer to '_'
export FLASK_DEBUG=1
flask run