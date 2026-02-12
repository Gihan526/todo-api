import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

dotenv.config();
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", // your React dev URL (change if different)
    credentials: true,
  }),
);

const app = express();
const port = process.env.PORT;
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
console.log("Access:", ACCESS_SECRET ? "Loaded " : "Missing ");

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, ACCESS_SECRET, {
    expiresIn: "5m",
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

// Register a new user
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const results = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashed],
    );
    res.status(201).json({
      message: "User registered successfully",
      user: results.rows[0],
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { name, password } = req.body;
  try {
    const usercheck = await db.query("SELECT * FROM users WHERE name = $1", [
      name,
    ]);

    if (usercheck.rows.length === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const user = usercheck.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    const refreshTokenstore = await db.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2) RETURNING id, token",
      [user.id, refreshToken],
    );
    res.status(201).json({
      message: "User loged successfully",
      user: refreshTokenstore.rows[0],
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
      sameSite: "lax", // ok for localhost dev
      path: "/auth", // cookie sent only to /auth routes
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.post("/auth/logout", async (req, res) => {
  try {
    const rt = req.cookies.refreshToken;
    if (rt) {
      const delRefreshtoken = await db.query(
        "DELETE FROM refresh_tokens WHERE token = $1 RETURNING *",
        [rt],
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/auth",
    });

    res.json({ message: "logged out" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// Create a new task for a user
app.post("/addtask", async (req, res) => {
  const { user_id, title, description, status, due_data } = req.body;

  try {
    // Verify user exists
    const usercheck = await db.query("SELECT * FROM users WHERE name = $1", [
      user_id,
    ]);
    if (usercheck.rows.length === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const actualUserId = usercheck.rows[0].id;

    // Insert task and return created record
    const results = await db.query(
      "INSERT INTO todos (user_id, title, description, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [actualUserId, title, description, status, due_data],
    );

    res.status(201).json({
      message: "Todo created successfully",
      todo: results.rows[0],
    });
  } catch (error) {
    console.error("Error finding users", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks for a specific user
app.get("/alltasks/:userID", async (req, res) => {
  const userId = req.params.userID;
  try {
    const usertask = await db.query("SELECT * FROM todos WHERE user_id = $1", [
      userId,
    ]);
    if (usertask.rows.length === 0) {
      return res.status(404).json({ error: "No tasks found for this user" });
    }
    res.status(200).json({
      message: "Results found",
      tasks: usertask.rows,
    });
  } catch (error) {
    console.error("Tasks not found", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
app.put("/updatetasks/:userID/:id", async (req, res) => {
  const id = req.params.id;
  const userId = req.params.userID;
  const { title, description, status, due_data } = req.body;

  try {
    // Check if task exists and belongs to this user
    const taskCheck = await db.query(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: "Task not found for this user" });
    }

    // Update the task
    const update = await db.query(
      "UPDATE todos SET title = $1, description = $2, status = $3, due_date = $4 WHERE id = $5 RETURNING *",
      [title, description, status, due_data, id],
    );

    res.status(200).json({
      message: "Task updated successfully",
      task: update.rows[0],
    });
  } catch (error) {
    console.error("Error updating task", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
app.delete("/deletetask/:userID/:id", async (req, res) => {
  const id = req.params.id;
  const userId = req.params.userID;

  try {
    // Check if task exists and belongs to this user
    const taskCheck = await db.query(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: "Task not found for this user" });
    }

    // Delete the task
    const del = await db.query(
      "DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );

    res.status(200).json({
      message: "Task deleted successfully",
      deletedTask: del.rows[0],
    });
  } catch (error) {
    console.error("Error deleting task", error);
    res.status(500).json({ error: error.message });
  }
});

// Update task status
app.patch("/completetask/:userID/:id", async (req, res) => {
  const id = req.params.id;
  const userId = req.params.userID;
  const userinput = req.body.userinput;

  const allowed = ["pending", "in progress", "done"];

  if (!allowed.includes(userinput?.toLowerCase().trim())) {
    return res.status(400).json({
      error: "Status must be: pending, in progress, or done",
    });
  }

  try {
    // Check if task exists and belongs to this user
    const taskCheck = await db.query(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: "Task not found for this user" });
    }

    // Update task status
    const updatecomplete = await db.query(
      "UPDATE todos SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [userinput, id, userId],
    );

    res.status(200).json({
      message: "Task status updated successfully",
      task: updatecomplete.rows[0],
    });
  } catch (error) {
    console.error("Error updating task status", error);
    res.status(500).json({ error: error.message });
  }
});

// Filter tasks by status
app.get("/filtertasks/:userID", async (req, res) => {
  const userId = req.params.userID;
  const status = req.query.status;

  if (!status) {
    return res
      .status(400)
      .json({ error: "Status query parameter is required" });
  }

  try {
    // Get tasks for user with specific status
    const filteredTasks = await db.query(
      "SELECT * FROM todos WHERE user_id = $1 AND status = $2",
      [userId, status],
    );

    if (filteredTasks.rows.length === 0) {
      return res.status(404).json({
        error: `No tasks found with status '${status}' for this user`,
      });
    }

    res.status(200).json({
      message: "Tasks found",
      tasks: filteredTasks.rows,
    });
  } catch (error) {
    console.error("Error filtering tasks", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
