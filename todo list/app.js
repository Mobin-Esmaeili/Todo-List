let tasks = [];

document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:3000/tasks")
    .then((result) => result.json())
    .then((data) => {
      tasks = data;
      updateTasks();
      progressChange();
    });
});

function addTask() {
  let taskInput = document.getElementById("task").value;

  if (!taskInput) {
    document.getElementById("inputError").textContent = "fill in the input";
  } else {
    document.getElementById("inputError").textContent = "";
    let newTask = { text: taskInput, completed: false, status: "todo" };
    fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTask),
    })
      .then((response) => response.json())
      .then(() => {
        document.getElementById("task").value = "";
        fetchTasks();
      });
  }
}

function fetchTasks() {
  fetch("http://localhost:3000/tasks")
    .then((data) => data.json())
    .then((response) => {
      tasks = response;
      updateTasks();
      progressChange();
    });
}

function toggleTaskCompleted(taskId) {
  let task = tasks.find((t) => t.id === taskId);

  let updatedTask = { completed: !task.completed };

  fetch(`http://localhost:3000/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTask),
  })
    .then((response) => response.json())
    .then(() => fetchTasks());
}

function deleteTask(taskId) {
  fetch(`http://localhost:3000/tasks/${taskId}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then(() => {
      fetchTasks();
    });
}

function editTask(taskId) {
  let editedTask = tasks.find((t) => t.id === taskId);
  let taskInput = document.getElementById("task");
  taskInput.value = editedTask.text;

  let addBtn = document.getElementById("addBtn");
  addBtn.onclick = function () {
    let updatedText = taskInput.value;

    fetch(`http://localhost:3000/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: updatedText }),
    })
      .then((response) => response.json())
      .then(() => {
        deleteTask(taskId);
        fetchTasks();
        taskInput.value = "";
      });
  };
}

function updateTasks() {
  let todoList = document.querySelector("#taskList");
  let inProgressList = document.querySelector("#inProgressTasks");
  let doneList = document.querySelector("#doneTasks");

  todoList.innerHTML = "";
  inProgressList.innerHTML = "";
  doneList.innerHTML = "";

  tasks.forEach((task) => {
    let listItems = document.createElement("li");
    listItems.classList.add("task-item");
    listItems.setAttribute("draggable", "true");
    listItems.setAttribute("data-id", task.id);

    listItems.innerHTML = `
        <div class="item-desc">
           <input type="checkbox" ${task.completed ? "checked" : ""}>
           <p id="taskText" class="task-text">${task.text}</p>
        </div>
        <div class="icons">
           <i class="fa fa-pencil-square-o editBtn"></i>
           <i class="fa fa-trash-o trashBtn"></i>
        </div>`;

    // delete functionality
    let deleteBtn = listItems.querySelector(".trashBtn");
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    // edit functionality
    let editBtn = listItems.querySelector(".editBtn");
    editBtn.addEventListener("click", () => editTask(task.id));

    // toggle functionality
    listItems.addEventListener("change", () => toggleTaskCompleted(task.id));

    // Drag and Drop to in-Progress
    listItems.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("taskId", task.id);
      console.log(e.dataTransfer.getData("taskId"));
    });

    inProgressList.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    inProgressList.addEventListener("drop", function (e) {
      e.preventDefault();
      let taskId = e.dataTransfer.getData("taskId");
      let selectedTask = tasks.find((t) => t.id == taskId);

      if (selectedTask) {
        fetch(`http://localhost:3000/tasks/${taskId}` , {
          method : "PATCH",
          body : JSON.stringify({status : "in-progress"})
        })
          .then((response) => response.json())
          .then(() => {
            let draggedItem = document.querySelector(`[data-id='${taskId}']`);
            if (draggedItem) {
              inProgressList.appendChild(draggedItem);
            }
          });
      }
    });

    // Drag and Drop to done

    listItems.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("taskId", task.id);
    });

    doneList.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    doneList.addEventListener("drop", function (e) {
      e.preventDefault();
      let taskId = e.dataTransfer.getData("taskId");
      let selectedTask = tasks.find((t) => t.id == taskId);

      if (selectedTask) {
        fetch(`http://localhost:3000/tasks/${taskId}` , {
          method : "PATCH",
          body : JSON.stringify({status : "done" , completed : true})
        })
          .then((response) => response.json())
          .then(() => {
            let draggedItem = document.querySelector(`[data-id='${taskId}']`);
            if (draggedItem) {
              inProgressList.appendChild(draggedItem);
            }
          });
      }
    });

    //appending
    if (task.status === "todo") {
      todoList.appendChild(listItems);
    }
    if (task.status === "in-progress") {
      inProgressList.appendChild(listItems);
    }
    if (task.status === "done") {
      doneList.appendChild(listItems);
    }
  });
}

function progressChange() {
  let completedTask = tasks.filter((task) => task.completed).length;
  let totalTask = tasks.length;
  let progressBar = document.getElementById("progress");
  let progressText = document.getElementById("number");

  if (totalTask === 0) {
    progressBar.style.width = "0%";
    progressText.innerText = "0 / 0";
  } else {
    let percent = (completedTask / totalTask) * 100;
    progressBar.style.width = `${percent}%`;
    progressText.innerText = `${completedTask} / ${totalTask}`;
  }
}

document.getElementById("addBtn").addEventListener("click", function (event) {
  event.preventDefault();

  addTask();
  updateTasks();
});
