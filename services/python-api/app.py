from flask import Flask, jsonify, make_response
import sys
import google.cloud.logging

app = Flask(__name__)
# Imports the Cloud Logging client library

# Instantiates a client
client = google.cloud.logging.Client()

# Retrieves a Cloud Logging handler based on the environment
# you're running in and integrates the handler with the
# Python logging module. By default this captures all logs
# at INFO level and higher
client.setup_logging()
import logging


@app.route('/')
def hello_world():
    logging.info('Hello world endpoint accessed')   # Goes to stdout
    data = {"status": "ok", "data": "Hello World"}
    return jsonify(data)

@app.route('/health')
def health_check():
    logging.info('health endpoint accessed') 
    data = {"status": "ok", "data": "Healthy"}
    return 'Healthy', 200

@app.route('/error')
def trigger_error():
    logging.error('error endpoint accessed') 
    data = {"status": "error", "data": "not healthy"}
    return 'Error', 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)