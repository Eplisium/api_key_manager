import logging
import logging.config
from flask import Flask, render_template, request, jsonify, redirect, url_for
from database import db, APIKey, Project
from datetime import datetime

logging.config.fileConfig('logging.conf')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///keys.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your-secret-key-here'

db.init_app(app)

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
        keys = APIKey.query.all()
        return jsonify([key.to_dict() for key in keys])
    except Exception as e:
        logger.error(f"Error fetching keys: {str(e)}")
        return jsonify({'error': 'Failed to fetch keys'}), 500

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
            
        new_key = APIKey(
            name=unique_name,
            key=data['key'],
            description=data.get('description'),
            used_with=data.get('used_with'),
            project_id=project_id
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

@app.cli.command("init-db")
def init_db():
    with app.app_context():
        db.create_all()
    print("Database initialized")

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)# Main application file 