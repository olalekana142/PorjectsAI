from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler
from config.settings import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize scheduler for daily operations
scheduler = BackgroundScheduler()
scheduler.start()

from app import routes
