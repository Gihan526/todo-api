import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register a new user
app.post("/register", async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  try {
    await db.query("INSERT INTO users (name, email) VALUES ($1, $2)", [
      name,
      email,
    ]);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
