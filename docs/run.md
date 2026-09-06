# 🚀 TuneFetch - Execution & Run Guide

This guide provides step-by-step instructions for setting up, configuring, running, testing, and troubleshooting both the **Backend** and **Frontend** of **TuneFetch**.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration (.env)](#2-environment-configuration-env)
3. [Running the Backend](#3-running-the-backend)
4. [Running the Frontend](#4-running-the-frontend)
5. [Running Automated Tests](#5-running-automated-tests)
6. [Building for Production](#6-building-for-production)
7. [Common Gotchas & Troubleshooting](#7-common-gotchas--troubleshooting)

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Python**: Version `3.10` or higher (Python `3.12+` recommended)
- **Node.js**: Version `18.0.0` or higher & `npm`
- **Git**

---

## 2. Environment Configuration (.env)

The backend requires environment variables to connect to Neon PostgreSQL, encrypt Spotify tokens, and authenticate with external APIs.

### Create the `.env` file
Inside the `backend/` directory (or workspace root), create a `.env` file from the example:

```bash
# In Windows PowerShell
Copy-Item .env.example backend\.env
```

### Fill in your credentials:

```ini
# 1. Neon PostgreSQL Database Connection (Must include ?sslmode=require)
DATABASE_URL=postgresql://neondb_owner:your_password@your-neon-endpoint.us-east-1.aws.neon.tech/neondb?sslmode=require

# 2. Spotify Developer Credentials (https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback

# 3. Serper API Key (https://serper.dev - for candidate audio resolution)
SERPER_API_KEY=your_serper_api_key_here

# 4. Security Secrets
ENCRYPTION_KEY=D704Q8l-s_gQ9Yj6uX2kO1Kz3-h1x9jL0yA5m8B_yFw=
SESSION_SECRET_KEY=tunefetch-secure-cookie-session-secret-key-32chars
FRONTEND_URL=http://localhost:5173
```

> **Generating a new Fernet Encryption Key (Optional)**:
> ```bash
> python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
> ```

---

## 3. Running the Backend

### Step 1: Open terminal and navigate to `backend`
```bash
cd backend
```

### Step 2: Create & activate Python virtual environment

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If you see an execution policy error, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)*

**On Windows (Command Prompt):**
```cmd
venv\Scripts\activate
```

**On macOS / Linux:**
```bash
source venv/bin/activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Start the FastAPI server
Run `run.py` from the `backend/` directory:

```bash
python run.py
```

> **⚡ Auto-Venv Detection Feature**:
> `backend/run.py` features an intelligent virtual environment auto-delegator. If you invoke `python run.py` using global Python while a local `venv` exists, `run.py` automatically detects `backend/venv/Scripts/python.exe` and re-launches itself inside the virtual environment without manual activation required!

The backend server will start at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

---

## 4. Running the Frontend

### Step 1: Open a second terminal and navigate to `frontend`
```bash
cd frontend
```

### Step 2: Install Node modules
```bash
npm install
```

### Step 3: Start the Vite development server
```bash
npm run dev
```

### Step 4: Open your browser
Navigate to:
```
http://localhost:5173
```

*(Requests to `/api` and `/spotify` are automatically proxied to `http://127.0.0.1:8000` via `vite.config.js`)*

---

## 5. Running Automated Tests

To run the complete automated test suite (testing PKCE generation, Fernet token encryption at rest, automatic token refreshing, 1,400+ playlist pagination, Serper resolution, Neon PostgreSQL caching, and multi-user isolation):

From the project root:

```bash
# Using the backend virtualenv directly
backend\venv\Scripts\pytest backend\tests\test_spotify_pipeline.py
```

Or from the `backend/` directory with virtualenv activated:
```bash
pytest tests/test_spotify_pipeline.py
```

---

## 6. Building for Production

### Frontend Bundle:
```bash
cd frontend
npm run build
```
The compiled static assets will be output to `frontend/dist/`.

### Backend Production Server:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 7. Common Gotchas & Troubleshooting

### ❌ `can't open file '.../backend/main.py': [Errno 2] No such file or directory`
- **Cause**: Trying to execute `python main.py` directly from `backend/`. The file is located at `app/main.py`.
- **Fix**: Run `python run.py` instead, which configures `sys.path` and launches `app.main:app`.

### ❌ `The term 'venv/Scripts/activate' is not recognized`
- **Cause**: Forward slashes in Windows PowerShell or running from the wrong working directory.
- **Fix**: Use backslashes or `cd backend` first:
  ```powershell
  cd backend
  .\venv\Scripts\Activate.ps1
  ```
  *(Or simply invoke `python run.py`, which auto-delegates to the venv!)*

### ❌ Spotify `INVALID_CLIENT: Invalid redirect URI`
- **Cause**: The redirect URI in Spotify Developer Dashboard does not match `SPOTIFY_REDIRECT_URI`.
- **Fix**: Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) -> Your App -> **Settings** -> **Redirect URIs** -> Add `http://127.0.0.1:8000/spotify/callback` (or `http://localhost:8000/spotify/callback`).

### ❌ PostgreSQL Connection / SSL Error
- **Cause**: Neon requires TLS/SSL connection.
- **Fix**: Ensure your `DATABASE_URL` ends with `?sslmode=require`.

### ❌ Serper API Key Missing
- **Behavior**: If `SERPER_API_KEY` is not provided, TuneFetch automatically switches to `ytsearch1:` fallback mode so downloads continue seamlessly.
