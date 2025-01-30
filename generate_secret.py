#!/usr/bin/env python3
import os
import secrets
import platform

def generate_secret_key():
    # Generate a 32-byte (256-bit) random secret in URL-safe base64 format
    return secrets.token_urlsafe(32)

if __name__ == '__main__':
    current_key = os.environ.get('FLASK_SECRET_KEY')
    
    if current_key:
        print("⚠️  FLASK_SECRET_KEY already exists in environment")
        print(f"Current value: {current_key}")
        print("\nGenerate new anyway? (y/N) ", end='')
        if input().lower() != 'y':
            exit()
    
    new_key = generate_secret_key()
    print("\n🔑 Generated new Flask secret key:")
    print(f"FLASK_SECRET_KEY={new_key}")
    
    print("\nTo use this key:")
    
    # Universal instructions
    print("1. For temporary use (current session):")
    print(f"   Temporary set (any OS): python -c \"import os; os.environ['FLASK_SECRET_KEY'] = '{new_key}'\"")
    
    # Platform-specific instructions
    system = platform.system()
    print("\n2. For permanent use:")
    
    if system == "Windows":
        print("   Command Prompt:")
        print(f"      setx FLASK_SECRET_KEY \"{new_key}\"")
        print("\n   PowerShell:")
        print(f"      [Environment]::SetEnvironmentVariable(\"FLASK_SECRET_KEY\", \"{new_key}\", \"User\")")
    else:
        print("   Unix/MacOS:")
        print(f"      echo 'export FLASK_SECRET_KEY=\"{new_key}\"' >> ~/.bashrc")
        print(f"      echo 'export FLASK_SECRET_KEY=\"{new_key}\"' >> ~/.zshrc")
        print("      source ~/.bashrc  # or restart your terminal")

    print("\n3. For production deployment:")
    print("   - Set in Docker/Podman environment variables")
    print("   - Configure in cloud platform settings")
    print("   - Use secret management system (Vault, AWS Secrets Manager, etc.)") 