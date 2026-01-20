const vscode = acquireVsCodeApi();

const tasksDiv = document.getElementById("tasks");
const input = document.getElementById("taskInput");
const dueInput = document.getElementById("dueInput");
const categoryInput = document.getElementById("categoryInput");
const prioritySelect = document.getElementById("priority");
const searchInput = document.getElementById("search");
const statsDiv = document.getElementById("stats");
const progressBar = document.getElementById("progressBar");
const addBtn = document.getElementById("addBtn");

let tasks = [];
let draggedId = null;
let placeholder = null;

vscode.postMessage({ type: "load" });

window.addEventListener("message", event => {
  const { type, tasks: loadedTasks } = event.data || {};
  if (type === "load" && Array.isArray(loadedTasks)) {
    tasks = loadedTasks;
    render();
  }
});

function save() {
  vscode.postMessage({ type: "save", tasks });
}

function addTask() {
  const value = input.value.trim();
  if (!value) return;

  tasks.push({
    id: crypto.randomUUID(),
    text: value,
    done: false,
    priority: prioritySelect.value,
    due: dueInput.value || null,
    category: categoryInput.value.trim() || null,
    createdAt: Date.now()
  });

  input.value = "";
  dueInput.value = "";
  categoryInput.value = "";

  save();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  save();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function editTask(id, value) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.text = value;
  save();
}

function isOverdue(task) {
  if (!task.due || task.done) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.due < today;
}

function updateStats() {
  const doneCount = tasks.filter(t => t.done).length;
  const total = tasks.length;

  statsDiv.textContent = `${doneCount} / ${total} completed`;

  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  progressBar.style.width = `${percent}%`;
}

function handleDragStart(e, id) {
  draggedId = id;
  e.dataTransfer.effectAllowed = "move";
  e.currentTarget.classList.add("dragging");

  placeholder = document.createElement("div");
  placeholder.className = "drag-placeholder";
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  draggedId = null;
  if (placeholder?.parentNode) placeholder.remove();
  placeholder = null;
  save();
  render();
}

function handleDragOver(e, overId) {
  e.preventDefault();
  if (!draggedId || draggedId === overId) return;

  const draggingIndex = tasks.findIndex(t => t.id === draggedId);
  const overIndex = tasks.findIndex(t => t.id === overId);
  if (draggingIndex === -1 || overIndex === -1) return;

  const container = tasksDiv;
  const overElement = [...container.children].find(el => el.dataset.id === overId);
  if (!overElement || placeholder?.parentNode === container) return;

  container.insertBefore(placeholder, overElement);
}

function handleDrop(e, dropId) {
  e.preventDefault();
  if (!draggedId || draggedId === dropId) return;

  const fromIndex = tasks.findIndex(t => t.id === draggedId);
  const toIndex = tasks.findIndex(t => t.id === dropId);

  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, moved);
}

function render() {
  const filter = searchInput.value.toLowerCase();
  tasksDiv.innerHTML = "";

  const filtered = tasks.filter(t =>
    t.text.toLowerCase().includes(filter)
  );

  filtered.forEach(task => {
    const div = document.createElement("div");
    div.className ="task glass " +
      task.priority +
      (task.done ? " done" : "") +
      (isOverdue(task) ? " overdue" : "");


    div.dataset.id = task.id;

    const left = document.createElement("div");
    left.className = "task-left";

    const grip = document.createElement("div");
    grip.className = "drag-handle";
    grip.textContent = "≡";
    grip.draggable = true;

    grip.addEventListener("dragstart", e => handleDragStart(e, task.id));
    grip.addEventListener("dragend", handleDragEnd);

    const checkbox = document.createElement("div");
    checkbox.className = "checkbox" + (task.done ? " checked" : "");
    checkbox.addEventListener("click", () => toggleTask(task.id));

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = task.text;
    textInput.addEventListener("input", e => editTask(task.id, e.target.value));

    left.appendChild(grip);
    left.appendChild(checkbox);
    left.appendChild(textInput);
    // Priority chip
    const priorityChip = document.createElement("span");
    priorityChip.className = `chip ${task.priority}`;
    priorityChip.textContent = task.priority;
    left.appendChild(priorityChip);

    // Category chip
    if (task.category) {
      const cat = document.createElement("span");
      cat.className = "chip category";
      cat.textContent = task.category;
      left.appendChild(cat);
    }


    if (task.due) {
      const due = document.createElement("span");
      due.className = "chip due" + (isOverdue(task) ? " overdue" : "");
      due.textContent = task.due;
      left.appendChild(due);
    }

    const delBtn = document.createElement("button");
    delBtn.className = "delete";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    div.appendChild(left);
    div.appendChild(delBtn);

    div.addEventListener("dragover", e => handleDragOver(e, task.id));
    div.addEventListener("drop", e => handleDrop(e, task.id));

    tasksDiv.appendChild(div);
  });

  updateStats();
}

// Events
addBtn.addEventListener("click", addTask);

input.addEventListener("keypress", e => {
  if (e.key === "Enter") addTask();
});

searchInput.addEventListener("input", render);
