# API Key Manager

A Flask-based web application for managing API keys and organizing them by projects. This application provides a clean interface to store, retrieve, and organize your API keys securely.

## Features

- Store and manage API keys with descriptions
- Organize keys by projects
- RESTful API endpoints
- Modern web interface
- Logging system for tracking operations

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd api-key-manager
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install flask flask-sqlalchemy
```

4. Initialize the database:
```bash
flask init-db
```

5. Start the application:
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## API Endpoints

- `GET /keys` - List all API keys
- `GET /keys/<id>` - Get a specific key
- `POST /keys` - Add a new key
- `PUT /keys/<id>` - Update a key
- `DELETE /keys/<id>` - Delete a key
- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `DELETE /projects/<id>` - Delete a project
- `PUT /projects/<id>` - Update a project
- `PATCH /keys/<id>/project` - Assign a key to a project

## Security Note

This application is designed for local use. Make sure to:
- Keep your database file secure
- Don't expose the application to the internet without proper security measures
- Use environment variables for sensitive configurations in production

## License

None now, but will be added later.