# Todo API

A RESTful API for managing users and tasks, built with Node.js, Express, and PostgreSQL.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- dotenv

## Setup

### Prerequisites

- Node.js
- PostgreSQL

### Installation

1. Install dependencies
```bash
npm install
```

2. Create `.env` file:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=your_password
DB_PORT=5433
PORT=3000
```

3. Create database tables:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Start server
```bash
npm start
```

Server runs at `http://localhost:3000`

## API Endpoints

### Users

**Register User**
```http
POST /register
Content-Type: application/json
```

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

Response (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-01-18T..."
  }
}
```

### Tasks

**Create Task**
```http
POST /addtask
Content-Type: application/json
```

Request:
```json
{
  "user_id": "John Doe",
  "title": "Complete project",
  "description": "Finish the API",
  "status": "pending",
  "due_data": "2026-01-25"
}
```

Response (201):
```json
{
  "message": "Todo created successfully",
  "todo": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project",
    "description": "Finish the API",
    "status": "pending",
    "due_date": "2026-01-25T..."
  }
}
```

**Get All Tasks**
```http
GET /alltasks/:userID
```

Response (200):
```json
{
  "message": "Results found",
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Complete project",
      "description": "Finish the API",
      "status": "pending",
      "due_date": "2026-01-25T..."
    }
  ]
}
```

**Filter Tasks**
```http
GET /filtertasks/:userID?status=pending
```

Response (200):
```json
{
  "message": "Tasks found",
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Complete project",
      "status": "pending",
      "due_date": "2026-01-25T..."
    }
  ]
}
```

**Update Task**
```http
PUT /updatetasks/:userID/:id
Content-Type: application/json
```

Request:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in progress",
  "due_data": "2026-01-30"
}
```

Response (200):
```json
{
  "message": "Task updated successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Updated title",
    "description": "Updated description",
    "status": "in progress",
    "due_date": "2026-01-30T..."
  }
}
```

**Update Status**
```http
PATCH /completetask/:userID/:id
Content-Type: application/json
```

Request:
```json
{
  "userinput": "done"
}
```

Response (200):
```json
{
  "message": "Task status updated successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project",
    "status": "done",
    "due_date": "2026-01-25T..."
  }
}
```

**Delete Task**
```http
DELETE /deletetask/:userID/:id
```

Response (200):
```json
{
  "message": "Task deleted successfully",
  "deletedTask": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project",
    "description": "Finish the API",
    "status": "pending",
    "due_date": "2026-01-25T..."
  }
}
```

## Status Values

- `pending`
- `in progress`
- `done`

## License

ISC
