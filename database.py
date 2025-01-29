from flask_sqlalchemy import SQLAlchemy
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os

db = SQLAlchemy()

def generate_key(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
    if salt is None:
        salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    position = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'position': self.position,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class APIKey(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key = db.Column(db.String(256), nullable=False)
    encrypted = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    encryption_salt = db.Column(db.LargeBinary, nullable=True)
    description = db.Column(db.Text)
    used_with = db.Column(db.String(200))
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=True)
    project = db.relationship('Project', backref='keys')
    position = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    __table_args__ = (
        db.UniqueConstraint('name', 'project_id', name='unique_name_per_project'),
    )

    def encrypt_key(self, password: str) -> None:
        if self.encrypted:
            raise ValueError("Key is already encrypted")
            
        key, salt = generate_key(password)
        f = Fernet(key)
        encrypted_data = f.encrypt(self.key.encode())
        self.key = base64.b64encode(encrypted_data).decode('utf-8')
        self.encryption_salt = salt
        self.encrypted = True

    def decrypt_key(self, password: str) -> None:
        if not self.encrypted:
            raise ValueError("Key is not encrypted")
            
        key, _ = generate_key(password, self.encryption_salt)
        f = Fernet(key)
        encrypted_data = base64.b64decode(self.key.encode('utf-8'))
        try:
            decrypted_data = f.decrypt(encrypted_data)
            self.key = decrypted_data.decode('utf-8')
            self.encrypted = False
            self.encryption_salt = None
        except Exception as e:
            raise ValueError("Invalid password or corrupted data") from e

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'key': self.key,
            'encrypted': self.encrypted,
            'description': self.description,
            'used_with': self.used_with,
            'project': self.project.to_dict() if self.project else None,
            'position': self.position,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }# Database configuration and functions 