# CMMS Platform Backend

This is the backend application for the Facility Management System (CMMS). It is built with FastAPI, SQLAlchemy, and SQLite.

## Startup Guide

### Prerequisites
- Python 3.8+
- Recommended: A virtual environment (e.g. `venv` or `conda`)

### 1. Set Up Environment

Navigate to the `backend` directory:
```bash
cd backend
```

(Optional but recommended) Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# .\venv\Scripts\activate # On Windows
```

### 2. Install Dependencies

Install the required Python packages from the `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Ensure you have a `.env` file in the `backend` directory with the necessary configurations. 

### 4. Run the Server

Start the FastAPI application using Uvicorn:

```bash
uvicorn server:app --reload
```

The server will start running on [http://localhost:8000](http://localhost:8000).

- You can access the automatic API documentation provided by FastAPI at [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI).
- Or the ReDoc documentation at [http://localhost:8000/redoc](http://localhost:8000/redoc).
