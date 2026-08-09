import { useEffect, useMemo, useRef, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import TaskFilters from "./components/TaskFilters";
import "./App.css";

const initialTasks = [
  { id: 1, text: "Studiare React", done: false, priority: "media", dueDate: null },
  { id: 2, text: "Fare esercizio su useState", done: true, priority: "bassa", dueDate: null },
];

function normalizeTasks(value) {
  if (!Array.isArray(value)) return initialTasks;

  return value.map((task, index) => ({
    ...task,
    dueDate: task.dueDate ?? null,
    order: typeof task.order === "number" ? task.order : index,
  }));
}

function parseDate(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function isOverdue(value, done) {
  if (!value || done) return false;

  const dueDate = parseDate(value);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function isDueSoon(value, done) {
  if (!value || done) return false;

  const dueDate = parseDate(value);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekLater = new Date(today);
  weekLater.setDate(today.getDate() + 7);

  return dueDate >= today && dueDate <= weekLater;
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aHasManualOrder = typeof a.order === "number";
    const bHasManualOrder = typeof b.order === "number";

    if (aHasManualOrder || bHasManualOrder) {
      const aOrder = aHasManualOrder ? a.order : 0;
      const bOrder = bHasManualOrder ? b.order : 0;
      return aOrder - bOrder;
    }

    const aOverdue = isOverdue(a.dueDate, a.done);
    const bOverdue = isOverdue(b.dueDate, b.done);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;

    if (!a.dueDate && !b.dueDate) return 0;

    return parseDate(a.dueDate) - parseDate(b.dueDate);
  });
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("tasks");
      return saved ? normalizeTasks(JSON.parse(saved)) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [filter, setFilter] = useState("all");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function addTask(text, dueDate) {
    const clean = text.trim();
    if (!clean) return;

    const newTask = {
      id: Date.now(),
      text: clean,
      done: false,
      priority: "bassa",
      dueDate: dueDate || null,
      order: -1,
    };

    setTasks((prev) => [newTask, ...prev.map((task, index) => ({ ...task, order: index + 1 }))]);
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function deleteTask(id) {
    const ok = window.confirm("Vuoi davvero eliminare questa task?");
    if (!ok) return;

    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function editTask(id, newText, newDueDate) {
    const clean = newText.trim();
    if (!clean) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, text: clean, dueDate: newDueDate || null }
          : task
      )
    );
  }

  function changePriority(id, newPriority) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, priority: newPriority } : task
      )
    );
  }

  function resetTasks() {
    const ok = window.confirm("Vuoi davvero resettare tutte le task?");
    if (!ok) return;
    setTasks(initialTasks);
    setFilter("all");
  }

  function toggleTheme() {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }

  function reorderTasks(fromId, toId) {
    const sourceId = Number(fromId);
    const targetId = Number(toId);

    if (!sourceId || !targetId || sourceId === targetId) return;

    setTasks((prevTasks) => {
      const sourceIndex = prevTasks.findIndex((task) => task.id === sourceId);
      const targetIndex = prevTasks.findIndex((task) => task.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return prevTasks;

      const nextTasks = [...prevTasks];
      const [movedTask] = nextTasks.splice(sourceIndex, 1);
      nextTasks.splice(targetIndex, 0, movedTask);
      return nextTasks.map((task, index) => ({ ...task, order: index }));
    });
    setDraggedTaskId(null);
  }

  function moveTask(id, direction) {
    setTasks((prevTasks) => {
      const ordered = [...prevTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const index = ordered.findIndex((task) => task.id === id);
      if (index < 0) return prevTasks;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return prevTasks;

      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      const withOrder = next.map((task, idx) => ({ ...task, order: idx }));

      const byId = new Map(withOrder.map((task) => [task.id, task]));
      return prevTasks.map((task) => byId.get(task.id) ?? task);
    });
  }

  function exportTasks() {
    const payload = JSON.stringify(tasks, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tasks.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importTasks(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const ok = window.confirm("Sostituire le task attuali con quelle importate?");
        if (!ok) return;
        setTasks(normalizeTasks(parsed));
        setFilter("all");
      } catch {
        window.alert("File JSON non valido.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  const visibleTasks = useMemo(() => {
    let filteredTasks = [];

    switch (filter) {
      case "due-soon":
        filteredTasks = tasks.filter((task) => isDueSoon(task.dueDate, task.done));
        break;
      case "overdue":
        filteredTasks = tasks.filter((task) => isOverdue(task.dueDate, task.done));
        break;
      default:
        filteredTasks = tasks;
        break;
    }

    return sortTasks(filteredTasks);
  }, [tasks, filter]);

  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;
  const todo = total - completed;

  return (
    <main className="app">
      <div className="top-bar">
        <h1>Task Manager</h1>

        <div className="actions">
          <button type="button" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Modalità chiara" : "🌙 Modalità scura"}
          </button>
          <button type="button" onClick={exportTasks}>
            Esporta JSON
          </button>
          <button type="button" onClick={() => importInputRef.current?.click()}>
            Importa JSON
          </button>
          <input ref={importInputRef} type="file" accept="application/json" onChange={importTasks} hidden />
        </div>
      </div>

      <TaskForm onAddTask={addTask} />

      <TaskFilters filter={filter} setFilter={setFilter} />

      <p>
        Totali: <strong>{total}</strong> · Completate: <strong>{completed}</strong> · Da fare: <strong>{todo}</strong>
      </p>

      <button className="danger" onClick={resetTasks}>
        Reset tasks
      </button>

      {visibleTasks.length === 0 ? (
        <p>Nessuna task da mostrare con il filtro selezionato.</p>
      ) : (
        <TaskList
          tasks={visibleTasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onPriorityChange={changePriority}
          onReorderTask={reorderTasks}
          onMoveTask={moveTask}
          onDragStart={setDraggedTaskId}
          draggedTaskId={draggedTaskId}
        />
      )}
    </main>
  );
}