from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, 
            static_folder='../static',
            static_url_path='/static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'static'), filename)