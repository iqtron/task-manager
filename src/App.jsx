import { useEffect, useMemo, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import TaskFilters from "./components/TaskFilters";
import "./App.css";

const initialTasks = [
  { id: 1, text: "Studiare React", done: false, priority: "media" },
  { id: 2, text: "Fare esercizio su useState", done: true, priority: "bassa" },
];

export default function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [filter, setFilter] = useState("all"); // all | active | completed

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask(text) {
    const clean = text.trim();
    if (!clean) return;

    const newTask = {
      id: Date.now(),
      text: clean,
      done: false,
      priority: "bassa",
    };

    setTasks((prev) => [newTask, ...prev]);
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function editTask(id, newText) {
    const clean = newText.trim();
    if (!clean) return;

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, text: clean } : task))
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

  const visibleTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "completed") return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const todo = total - completed;

  return (
    <main className="app">
      <h1>Task Manager</h1>

      <TaskForm onAddTask={addTask} />

      <TaskFilters filter={filter} setFilter={setFilter} />

      <p>
  Totali: <strong>{total}</strong> · Completate:{" "}
  <strong>{completed}</strong> · Da fare: <strong>{todo}</strong>
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
        />
      )}
    </main>
  );
}