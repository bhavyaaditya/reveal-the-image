# Backend Service (Phase 1)

Minimal HTTP API for the Reveal-the-Image project.

## Endpoints

### GET /health
Health check endpoint.

### GET /images
Returns mock image metadata.

## Local Development

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
