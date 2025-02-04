#!/bin/sh

# Wait for a moment to ensure everything is ready
sleep 1

# Initialize the database
flask db upgrade

# Start the Flask application
exec flask run --host=127.0.0.1 