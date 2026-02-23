# Todo API

RESTful API with JWT authentication for managing tasks.

## Stack

Node.js, Express, PostgreSQL

## Setup

```bash
npm install
```

Create `.env`:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=your_password
DB_PORT=5433
PORT=3000
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
```

Run SQL:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
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

Start:
```bash
npm start
```

## Endpoints

**Auth**
- `POST /auth/register` - Register user
- `POST /auth/login` - Login (sets JWT cookies)
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh access token

**Tasks** (requires auth)
- `POST /addtask` - Create task
- `GET /alltasks/:userID` - Get all tasks
- `GET /filtertasks/:userID?status=pending` - Filter tasks
- `PUT /updatetasks/:userID/:id` - Update task
- `PATCH /completetask/:userID/:id` - Update status
- `DELETE /deletetask/:userID/:id` - Delete task
