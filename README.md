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
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Tasks

**Create Task**
```http
POST /addtask
{
  "user_id": "John Doe",
  "title": "Complete project",
  "description": "Finish the API",
  "status": "pending",
  "due_data": "2026-01-25"
}
```

**Get All Tasks**
```http
GET /alltasks/:userID
```

**Filter Tasks**
```http
GET /filtertasks/:userID?status=pending
```

**Update Task**
```http
PUT /updatetasks/:userID/:id
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in progress",
  "due_data": "2026-01-30"
}
```

**Update Status**
```http
PATCH /completetask/:userID/:id
{
  "userinput": "done"
}
```

**Delete Task**
```http
DELETE /deletetask/:userID/:id
```

## Status Values

- `pending`
- `in progress`
- `done`

## License

ISC
