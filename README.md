# API Key Manager

![API Key Manager Picture](images/main.png)

A secure Flask-based web application for managing and organizing API keys with a modern, responsive interface. Perfect for developers and teams who need to maintain a centralized repository of API credentials with robust organization features.

## Key Features

### 🔑 API Key Management
- Store and organize API keys securely with optional encryption
- Add descriptions and service information for each key
- One-click copy to clipboard functionality
- Support for encrypted and unencrypted keys
- Automatic key name conflict resolution

### 📂 Project Organization
- Group API keys by projects
- Intuitive drag-and-drop interface for organizing keys
- Reorder keys within and between projects
- Smart position tracking for ordered lists
- Project-based filtering system

### 🔒 Security
- Optional encryption for sensitive API keys using PBKDF2 and Fernet
- Secure storage with SQLite database
- Transaction-based operations with automatic rollback
- Comprehensive activity logging
- Input validation and sanitization
- File encoding validation (UTF-8)

### 📥 Import/Export
- Import API keys from multiple formats:
  - Environment files (.env)
  - JSON files
  - YAML files
  - Properties files (.properties)
  - Configuration files (.conf, .config)
- Import directly from OS environment variables
- Export keys to .env, JSON, or YAML formats
- Database backup and restore functionality

### 🎨 Modern UI/UX
- Responsive design that works on all devices
- Dark/Light theme support
- Collapsible sidebar with state persistence
- Real-time updates and animations
- Interactive notifications
- Keyboard shortcuts
- Drag-and-drop interface

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- SQLite3

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Eplisium/API-Storage.git
cd API-Storage
```

2. Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Usage

1. Start the application:
```bash
python app.py
```

2. Access the web interface at `http://localhost:5000`

3. Basic operations:
   - Create projects to organize your keys
   - Add API keys with descriptions and service information
   - Use drag-and-drop to organize keys between projects
   - Import keys from various file formats
   - Export keys in your preferred format
   - Optionally encrypt sensitive keys

## Configuration

The application uses a simple configuration setup:

### Database
- Type: SQLite
- Default location: `instance/keys.db`
- Features:
  - Automatic timestamps
  - Unique constraints per project
  - Transaction support
  - Automatic cascade operations

### Logging
- Configuration file: `logging.conf`
- Log file: `api_key_manager.log`
- Features:
  - Configurable log levels
  - Detailed timestamps
  - Component-specific logging
  - Automatic log rotation

### Security
- Default configuration is for development
- For production:
  - Set `FLASK_SECRET_KEY` environment variable
  - Enable HTTPS if exposed to internet
  - Implement authentication if needed
  - Use environment variables for sensitive data

## API Endpoints

### Keys
- `GET /keys` - List all keys
  - Query params: `project_id`, `show_all`
- `GET /keys/<id>` - Get specific key
- `POST /keys` - Create key
- `PUT /keys/<id>` - Update key
- `DELETE /keys/<id>` - Delete key
- `PATCH /keys/<id>/project` - Move key to project
- `PATCH /keys/<id>/reorder` - Reorder key
- `POST /keys/encrypt` - Encrypt keys
- `POST /keys/decrypt` - Decrypt keys
- `GET /keys/status` - Get encryption status

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create project
- `PUT /projects/<id>` - Update project
- `DELETE /projects/<id>` - Delete project
- `POST /projects/<id>/import-env` - Import keys to project
- `GET /export` - Export keys (supports multiple formats)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

1. Database Errors
   - Ensure SQLite is installed
   - Check write permissions
   - Verify all migrations are applied
   - Check `api_key_manager.log` for details

2. Import/Export Issues
   - Ensure correct file format
   - Check file encoding (must be UTF-8)
   - Verify file permissions
   - Look for specific error messages in logs

3. UI Problems
   - Clear browser cache
   - Check browser console
   - Verify all static files are loading
   - Ensure JavaScript is enabled

4. Encryption Issues
   - Remember encryption password
   - Check key status before operations
   - Verify encryption status via API
   - Backup data before bulk encryption

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

For detailed contribution guidelines, please read CONTRIBUTING.md.