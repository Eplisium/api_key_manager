import logging
import logging.config
from flask import Flask, render_template, request, jsonify, redirect, url_for, send_file
from flask_migrate import Migrate
from database import db, APIKey, Project
from datetime import datetime
import re
import os
import io
import json
import yaml

logging.config.fileConfig('logging.conf')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///keys.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your-secret-key-here'

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/keys/<int:key_id>', methods=['GET'])
def get_key(key_id):
    try:
        key = APIKey.query.get_or_404(key_id)
        return jsonify(key.to_dict())
    except Exception as e:
        logger.error(f"Error fetching key {key_id}: {str(e)}")
        return jsonify({'error': 'Key not found'}), 404

@app.route('/keys', methods=['GET'])
def get_keys():
    try:
        logger.info("Fetching all keys from database...")
        # Get project_id from query params if it exists
        project_id = request.args.get('project_id', type=int)
        
        # Build query
        query = APIKey.query
        if project_id is not None:
            query = query.filter_by(project_id=project_id)
        elif project_id is None and request.args.get('show_all') != 'true':
            # If no project specified and not showing all, show only unassigned keys
            query = query.filter_by(project_id=None)
            
        # Order by position within each project
        keys = query.order_by(APIKey.project_id, APIKey.position).all()
        
        logger.info(f"Found {len(keys)} keys")
        result = [key.to_dict() for key in keys]
        logger.info("Successfully serialized keys to JSON")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error fetching keys: {str(e)}")
        logger.exception("Full traceback:")
        return jsonify({'error': f'Failed to fetch keys: {str(e)}'}), 500

@app.route('/keys', methods=['DELETE'])
def delete_all_keys():
    try:
        # Get count before deletion for logging
        count = APIKey.query.count()
        
        # Delete all keys
        APIKey.query.delete()
        db.session.commit()
        
        logger.info(f"Successfully deleted all {count} keys")
        return jsonify({'message': f'Successfully deleted {count} keys', 'count': count}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting all keys: {str(e)}")
        return jsonify({'error': 'Failed to delete all keys'}), 500

@app.route('/projects/<int:project_id>/keys', methods=['DELETE'])
def delete_project_keys(project_id):
    try:
        # Get count before deletion for logging
        count = APIKey.query.filter_by(project_id=project_id).count()
        
        # Delete project-specific keys
        APIKey.query.filter_by(project_id=project_id).delete()
        db.session.commit()
        
        logger.info(f"Successfully deleted {count} keys from project {project_id}")
        return jsonify({'message': f'Successfully deleted {count} keys', 'count': count}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting keys from project {project_id}: {str(e)}")
        return jsonify({'error': f'Failed to delete keys from project {project_id}'}), 500

def generate_unique_name(base_name, project_id=None):
    """Generate a unique name by adding a numeric suffix if needed."""
    name = base_name
    counter = 1
    while True:
        existing = APIKey.query.filter_by(name=name, project_id=project_id).first()
        if not existing:
            return name
        name = f"{base_name}{counter}"
        counter += 1

@app.route('/keys', methods=['POST'])
def add_key():
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'key' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        project_id = data.get('project_id')
        unique_name = generate_unique_name(data['name'], project_id)
        
        # Get the maximum position for the project
        max_position = db.session.query(db.func.max(APIKey.position)).filter(
            APIKey.project_id == project_id
        ).scalar() or -1
            
        new_key = APIKey(
            name=unique_name,
            key=data['key'],
            description=data.get('description'),
            used_with=data.get('used_with'),
            project_id=project_id,
            position=max_position + 1
        )
        
        db.session.add(new_key)
        db.session.commit()
        logger.info(f"Added new key: {unique_name}")
        return jsonify(new_key.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding key: {str(e)}")
        return jsonify({'error': 'Failed to add key'}), 500

@app.route('/keys/<int:key_id>', methods=['DELETE'])
def delete_key(key_id):
    try:
        key = APIKey.query.get_or_404(key_id)
        db.session.delete(key)
        db.session.commit()
        logger.info(f"Deleted key: {key.name}")
        return jsonify({'message': 'Key deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting key: {str(e)}")
        return jsonify({'error': 'Failed to delete key'}), 500

@app.route('/keys/<int:key_id>', methods=['PUT'])
def update_key(key_id):
    try:
        key = APIKey.query.get_or_404(key_id)
        data = request.get_json()
        
        if 'name' in data and data['name'] != key.name:
            unique_name = generate_unique_name(data['name'], data.get('project_id', key.project_id))
            key.name = unique_name
        if 'key' in data:
            key.key = data['key']
        if 'description' in data:
            key.description = data['description']
        if 'used_with' in data:
            key.used_with = data['used_with']
        if 'project_id' in data:
            key.project_id = data['project_id']
            # If project changed, check if name needs to be updated
            if key.project_id != data['project_id']:
                key.name = generate_unique_name(key.name, data['project_id'])
            
        db.session.commit()
        logger.info(f"Updated key: {key.name}")
        return jsonify(key.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating key: {str(e)}")
        return jsonify({'error': 'Failed to update key'}), 500

@app.route('/projects', methods=['GET'])
def get_projects():
    try:
        projects = Project.query.all()
        return jsonify([project.to_dict() for project in projects])
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        return jsonify({'error': 'Failed to fetch projects'}), 500

@app.route('/projects', methods=['POST'])
def create_project():
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Project name required'}), 400
            
        new_project = Project(name=data['name'])
        db.session.add(new_project)
        db.session.commit()
        return jsonify(new_project.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating project: {str(e)}")
        return jsonify({'error': 'Failed to create project'}), 500

@app.route('/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting project: {str(e)}")
        return jsonify({'error': 'Failed to delete project'}), 500

@app.route('/keys/<int:key_id>/project', methods=['PATCH'])
def update_key_project(key_id):
    try:
        key = APIKey.query.get_or_404(key_id)
        data = request.get_json()
        key.project_id = data.get('project_id')
        db.session.commit()
        return jsonify(key.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating key project: {str(e)}")
        return jsonify({'error': 'Failed to update project'}), 500

@app.route('/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        if 'name' in data:
            if Project.query.filter(Project.id != project_id, Project.name == data['name']).first():
                return jsonify({'error': 'Project name already exists'}), 409
            project.name = data['name']
            
        db.session.commit()
        logger.info(f"Updated project: {project.name}")
        return jsonify(project.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating project: {str(e)}")
        return jsonify({'error': 'Failed to update project'}), 500

@app.route('/keys/<int:key_id>/reorder', methods=['PATCH'])
def reorder_key(key_id):
    try:
        data = request.get_json()
        if 'new_position' not in data:
            return jsonify({'error': 'New position is required'}), 400

        key = APIKey.query.get_or_404(key_id)
        new_position = data['new_position']
        old_position = key.position
        target_project_id = data.get('project_id', key.project_id)  # Default to current project if not specified

        logger.info(f"Reordering key {key.name} from position {old_position} to {new_position}")
        logger.info(f"Project change: {key.project_id} -> {target_project_id}")

        with db.session.begin_nested():  # Create a savepoint
            if target_project_id == key.project_id and new_position >= 0:
                # Moving within the same project
                if new_position > old_position:
                    # Moving forward: update positions of keys between old and new position
                    affected = APIKey.query.filter(
                        APIKey.project_id == target_project_id,
                        APIKey.position <= new_position,
                        APIKey.position > old_position,
                        APIKey.id != key_id
                    ).update({APIKey.position: APIKey.position - 1})
                    logger.info(f"Updated {affected} keys moving forward")
                else:
                    # Moving backward: update positions of keys between new and old position
                    affected = APIKey.query.filter(
                        APIKey.project_id == target_project_id,
                        APIKey.position >= new_position,
                        APIKey.position < old_position,
                        APIKey.id != key_id
                    ).update({APIKey.position: APIKey.position + 1})
                    logger.info(f"Updated {affected} keys moving backward")
            else:
                # Moving to a different project or to the end of current project
                # Close the gap in the old project if changing projects
                if target_project_id != key.project_id:
                    affected_old = APIKey.query.filter(
                        APIKey.project_id == key.project_id,
                        APIKey.position > old_position
                    ).update({APIKey.position: APIKey.position - 1})
                    logger.info(f"Updated {affected_old} keys in old project")

                # Get max position in target project
                max_position = db.session.query(db.func.max(APIKey.position)).filter(
                    APIKey.project_id == target_project_id
                ).scalar() or -1
                
                # Set new position to end of target project
                new_position = max_position + 1
                key.project_id = target_project_id

            key.position = new_position
            db.session.flush()  # Ensure all position updates are applied

            # Normalize positions within the affected projects
            for project_id in {key.project_id, target_project_id}:
                if project_id is not None:
                    keys = APIKey.query.filter_by(project_id=project_id).order_by(APIKey.position).all()
                    for i, k in enumerate(keys):
                        if k.position != i:
                            k.position = i
                            logger.info(f"Fixed position for key {k.name}: {k.position} -> {i}")

        db.session.commit()
        logger.info(f"Successfully reordered key {key.name} to position {new_position}")
        return jsonify(key.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error reordering key: {str(e)}")
        logger.exception("Full traceback:")
        return jsonify({'error': f'Failed to reorder key: {str(e)}'}), 500

@app.route('/projects/<int:project_id>/import-env', methods=['POST'])
def import_env_file(project_id):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Check file extension (case-insensitive)
        allowed_extensions = {'.env', '.json', '.yaml', '.yml', '.properties', '.conf', '.config'}
        
        # Special handling for files that start with a dot
        filename = file.filename.lower()
        if filename.startswith('.'):
            file_ext = '.' + filename.split('.', 1)[1] if '.' in filename[1:] else filename
        else:
            file_ext = os.path.splitext(filename)[1]
        
        # Log the file details for debugging
        logger.info(f"Attempting to import file: {file.filename} (extension: {file_ext})")
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': f'Invalid file type. Supported formats: {", ".join(allowed_extensions)}'}), 400

        # Read the file content
        try:
            content = file.read().decode('utf-8')
        except UnicodeDecodeError:
            return jsonify({'error': 'File encoding not supported. Please ensure the file is UTF-8 encoded.'}), 400

        imported_keys = []
        
        if file_ext == '.json':
            # Parse JSON file
            try:
                import json
                data = json.loads(content)
                if isinstance(data, dict):
                    keys_to_import = flatten_json(data)
                else:
                    return jsonify({'error': 'Invalid JSON format. Expected object structure'}), 400
            except json.JSONDecodeError as e:
                return jsonify({'error': f'Invalid JSON format: {str(e)}'}), 400
                
        elif file_ext in {'.yaml', '.yml'}:
            # Parse YAML file
            try:
                import yaml
                data = yaml.safe_load(content)
                if isinstance(data, dict):
                    keys_to_import = flatten_json(data)
                else:
                    return jsonify({'error': 'Invalid YAML format. Expected object structure'}), 400
            except yaml.YAMLError as e:
                return jsonify({'error': f'Invalid YAML format: {str(e)}'}), 400
                
        else:  # .env, .properties, .conf, .config
            # More lenient regex pattern for env files
            # Supports various formats including:
            # KEY=value
            # KEY = value
            # KEY: value
            # KEY:value
            # export KEY=value
            # KEY='value'
            # KEY="value"
            # KEY=value # comment
            pattern = r'^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*[=:]\s*([\'\"]?.*?[\'\"]?)(?:\s*[#;].*)?$'
            
            keys_to_import = {}
            line_number = 0
            for line in content.split('\n'):
                line_number += 1
                line = line.strip()
                if not line or line.startswith(('#', '//', ';')):  # Skip comments and empty lines
                    continue
                    
                match = re.match(pattern, line)
                if match:
                    key_name = match.group(1)
                    key_value = match.group(2).strip('\'"')  # Strip quotes if present
                    keys_to_import[key_name] = key_value
                else:
                    logger.warning(f"Skipped invalid line {line_number} in {file.filename}: {line}")

            if not keys_to_import:
                return jsonify({'error': 'No valid key-value pairs found in the file. Please check the file format.'}), 400

        # Import the collected keys
        for key_name, key_value in keys_to_import.items():
            # Generate unique name if key already exists
            unique_name = generate_unique_name(key_name, project_id)
            
            # Get the maximum position for the project
            max_position = db.session.query(db.func.max(APIKey.position)).filter(
                APIKey.project_id == project_id
            ).scalar() or -1
            
            # Create new API key entry
            new_key = APIKey(
                name=unique_name,
                key=str(key_value),  # Convert to string in case of numeric values
                description=f"Imported from {file.filename}",
                project_id=project_id,
                position=max_position + 1
            )
            
            db.session.add(new_key)
            imported_keys.append(new_key)
        
        db.session.commit()
        logger.info(f"Successfully imported {len(imported_keys)} keys from {file.filename}")
        
        return jsonify({
            'message': f'Successfully imported {len(imported_keys)} keys',
            'keys': [key.to_dict() for key in imported_keys]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error importing file: {str(e)}")
        return jsonify({'error': f'Failed to import file: {str(e)}'}), 500

def flatten_json(data, parent_key='', sep='_'):
    """Flatten nested JSON structure into key-value pairs."""
    items = {}
    for k, v in data.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.update(flatten_json(v, new_key, sep=sep))
        else:
            items[new_key] = v
    return items

@app.cli.command("check-db")
def check_db():
    """Check database tables and schema."""
    try:
        with app.app_context():
            # Check if tables exist
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"Found tables: {tables}")
            
            # Check APIKey table structure
            if 'api_key' in tables:
                columns = inspector.get_columns('api_key')
                print("\nAPIKey table structure:")
                for col in columns:
                    print(f"Column: {col['name']} ({col['type']})")
            
            # Count records
            keys_count = APIKey.query.count()
            projects_count = Project.query.count()
            print(f"\nFound {keys_count} keys and {projects_count} projects")
            
    except Exception as e:
        print(f"Error checking database: {str(e)}")
        raise

@app.route('/export', methods=['GET'])
def export_keys():
    try:
        # Get export format and project_id from query params
        export_format = request.args.get('format', 'env')
        project_id = request.args.get('project_id', type=int)
        
        # Build query
        query = APIKey.query
        if project_id is not None:
            query = query.filter_by(project_id=project_id)
            project_name = Project.query.get_or_404(project_id).name
        
        # Order by position within each project
        keys = query.order_by(APIKey.project_id, APIKey.position).all()
        
        if not keys:
            return jsonify({'error': 'No keys found to export'}), 404
            
        # Prepare the output based on format
        if export_format == 'json':
            output = json.dumps({key.name: key.key for key in keys}, indent=2)
            mimetype = 'application/json'
            filename = f"api_keys_{project_name if project_id else 'all'}.json"
        elif export_format == 'yaml':
            output = yaml.dump({key.name: key.key for key in keys}, default_flow_style=False)
            mimetype = 'application/x-yaml'
            filename = f"api_keys_{project_name if project_id else 'all'}.yaml"
        else:  # .env format
            output = '\n'.join([f"{key.name}={key.key}" for key in keys])
            mimetype = 'text/plain'
            filename = f"api_keys_{project_name if project_id else 'all'}.env"
            
        # Create in-memory file
        buffer = io.BytesIO()
        buffer.write(output.encode('utf-8'))
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error exporting keys: {str(e)}")
        return jsonify({'error': f'Failed to export keys: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)# Main application file 