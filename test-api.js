// Comprehensive API test script
const testAPI = async () => {
  const baseURL = "http://localhost:4000";
  let userId;
  let taskId;

  console.log("🧪 Testing Todo API...\n");
  console.log("Make sure the API server is running on port 4000!\n");

  // Test 1: Register a new user
  console.log("1️⃣  Testing POST /register");
  try {
    const registerResponse = await fetch(`${baseURL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
      }),
    });
    const registerData = await registerResponse.json();
    console.log(`   Status: ${registerResponse.status}`);
    console.log(`   Response:`, registerData);
    if (registerData.user) {
      userId = registerData.user.id;
      console.log(`   ✅ User registered! ID: ${userId}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return;
  }

  // Test 2: Create a new task
  console.log("2️⃣  Testing POST /addtask");
  try {
    const addTaskResponse = await fetch(`${baseURL}/addtask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "Test User",
        title: "Sample Task",
        description: "This is a test task",
        status: "pending",
        due_data: "2026-02-01",
      }),
    });
    const addTaskData = await addTaskResponse.json();
    console.log(`   Status: ${addTaskResponse.status}`);
    console.log(`   Response:`, addTaskData);
    if (addTaskData.todo) {
      taskId = addTaskData.todo.id;
      console.log(`   ✅ Task created! ID: ${taskId}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: Get all tasks for user
  if (userId) {
    console.log("3️⃣  Testing GET /alltasks/:userID");
    try {
      const getTasksResponse = await fetch(`${baseURL}/alltasks/${userId}`);
      const getTasksData = await getTasksResponse.json();
      console.log(`   Status: ${getTasksResponse.status}`);
      console.log(`   Response:`, getTasksData);
      console.log(
        `   ✅ Retrieved ${getTasksData.tasks?.length || 0} task(s)\n`,
      );
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test 4: Update task status
  if (userId && taskId) {
    console.log("4️⃣  Testing PATCH /completetask/:userID/:id");
    try {
      const updateStatusResponse = await fetch(
        `${baseURL}/completetask/${userId}/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userinput: "in progress",
          }),
        },
      );
      const updateStatusData = await updateStatusResponse.json();
      console.log(`   Status: ${updateStatusResponse.status}`);
      console.log(`   Response:`, updateStatusData);
      console.log(`   ✅ Task status updated!\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test 5: Update task details
  if (userId && taskId) {
    console.log("5️⃣  Testing PUT /updatetasks/:userID/:id");
    try {
      const updateTaskResponse = await fetch(
        `${baseURL}/updatetasks/${userId}/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Updated Task Title",
            description: "This task has been updated",
            status: "done",
            due_data: "2026-02-15",
          }),
        },
      );
      const updateTaskData = await updateTaskResponse.json();
      console.log(`   Status: ${updateTaskResponse.status}`);
      console.log(`   Response:`, updateTaskData);
      console.log(`   ✅ Task updated!\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test 6: Filter tasks by status
  if (userId) {
    console.log("6️⃣  Testing GET /filtertasks/:userID?status=done");
    try {
      const filterResponse = await fetch(
        `${baseURL}/filtertasks/${userId}?status=done`,
      );
      const filterData = await filterResponse.json();
      console.log(`   Status: ${filterResponse.status}`);
      console.log(`   Response:`, filterData);
      console.log(`   ✅ Filtered ${filterData.tasks?.length || 0} task(s)\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Test 7: Delete task
  if (userId && taskId) {
    console.log("7️⃣  Testing DELETE /deletetask/:userID/:id");
    try {
      const deleteResponse = await fetch(
        `${baseURL}/deletetask/${userId}/${taskId}`,
        {
          method: "DELETE",
        },
      );
      const deleteData = await deleteResponse.json();
      console.log(`   Status: ${deleteResponse.status}`);
      console.log(`   Response:`, deleteData);
      console.log(`   ✅ Task deleted!\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("✨ API test complete!");
};

testAPI();
