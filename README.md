# Vakil - Legal Case Tracker

Vakil is a full-stack legal case-management application built as a guided learning project. It helps legal teams create, organize, search and monitor cases, statuses and upcoming hearing dates from one dashboard.

## Features

- Create and store legal cases
- View, update and delete cases
- Search by case number, title or client
- Filter cases by status
- Dashboard statistics for open, pending and closed matters
- Date-based hearing urgency indicators
- Client-side pagination
- Duplicate case-number prevention
- Input validation and structured error responses
- Responsive user interface
- Synthetic demonstration-data generator
- Automated model-validation tests

## Technology Stack

### Frontend

- React
- JavaScript
- Vite
- CSS
- ESLint

### Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

### Database

- MongoDB
- PyMongo

### Development

- Git
- pytest
- Swagger/OpenAPI documentation

## Architecture

```text
React frontend
      |
      | HTTP requests and JSON responses
      v
FastAPI backend
      |
      | Validation and business logic
      v
MongoDB database
```

The React frontend sends REST requests to FastAPI. FastAPI validates the request, applies server-side rules and communicates with MongoDB. The backend returns JSON responses that update the React interface.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Confirm that the API is running |
| GET | `/health` | Check API and database health |
| POST | `/cases` | Create a legal case |
| GET | `/cases` | Retrieve all cases |
| GET | `/cases/{case_number}` | Retrieve one case |
| PATCH | `/cases/{case_number}` | Update a case |
| DELETE | `/cases/{case_number}` | Delete a case |

## Local Setup

### Requirements

- Python
- Node.js and npm
- MongoDB Community Server
- Git

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Demonstration Data

The repository includes a generator for synthetic demonstration records:

```powershell
cd backend
python seed_cases.py
```

The script adds fictional case data until the database contains approximately 100 records. It does not represent real clients or legal matters.

## Testing

Run backend tests:

```powershell
cd backend
python -m pytest -v
```

Run the frontend code-quality check:

```powershell
cd frontend
npm run lint
```

## Important Design Decisions

- MongoDB case numbers use a unique index to prevent duplicates.
- Pydantic validates data before it reaches the database.
- MongoDB `ObjectId` values are converted into strings before JSON responses are returned.
- Hearing urgency is derived from the current date and next hearing date.
- Client-side pagination is suitable for the demonstration dataset.
- A production version should implement database-level pagination.

## Future Improvements

- Server-side pagination
- Authentication and role-based permissions
- Case-activity audit trail
- Hearing reminders and background jobs
- File and document uploads
- Kanban and calendar views
- Automated API integration tests
- Cloud deployment

## Project Status

Vakil is an educational demonstration project and is not intended for handling real confidential legal information.