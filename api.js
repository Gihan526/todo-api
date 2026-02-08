import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";

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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register a new user
app.post("/register", async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  try {
    const results = await db.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email],
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
