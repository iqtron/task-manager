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

function getPriorityRank(priority) {
  if (priority === "alta") return 0;
  if (priority === "media") return 1;
  return 2;
}

function getDueRank(task) {
  if (!task.dueDate || task.done) return 4;
  if (isOverdue(task.dueDate, task.done)) return 0;

  const dueDate = parseDate(task.dueDate);
  if (!dueDate) return 4;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dueDate.getTime() === today.getTime()) return 1;
  if (dueDate.getTime() === tomorrow.getTime()) return 2;
  if (isDueSoon(task.dueDate, task.done)) return 3;
  return 4;
}

function sortTasks(tasks, mode) {
  const compareByManualOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id;

  if (mode === "manual") {
    return [...tasks].sort(compareByManualOrder);
  }

  return [...tasks].sort((a, b) => {
    const aDone = a.done ? 1 : 0;
    const bDone = b.done ? 1 : 0;

    if (aDone !== bDone) return aDone - bDone;

    if (mode === "priority") {
      const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
      if (priorityDiff !== 0) return priorityDiff;

      const dueDiff = getDueRank(a) - getDueRank(b);
      if (dueDiff !== 0) return dueDiff;

      const dateA = a.dueDate ? parseDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
      const dateB = b.dueDate ? parseDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
      if (dateA !== dateB) return dateA - dateB;

      return compareByManualOrder(a, b);
    }

    if (mode === "due") {
      const dueDiff = getDueRank(a) - getDueRank(b);
      if (dueDiff !== 0) return dueDiff;

      const dateA = a.dueDate ? parseDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
      const dateB = b.dueDate ? parseDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
      if (dateA !== dateB) return dateA - dateB;

      const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
      if (priorityDiff !== 0) return priorityDiff;

      return compareByManualOrder(a, b);
    }

    const urgencyDiff = getDueRank(a) - getDueRank(b);
    if (urgencyDiff !== 0) return urgencyDiff;

    const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    const dateA = a.dueDate ? parseDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
    const dateB = b.dueDate ? parseDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
    if (dateA !== dateB) return dateA - dateB;

    return compareByManualOrder(a, b);
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
  const [showLegend, setShowLegend] = useState(false);
  const [sortMode, setSortMode] = useState(() => {
    if (typeof window === "undefined") return "manual";

    const savedSortMode = localStorage.getItem("sortMode");
    return savedSortMode === "manual" || savedSortMode === "priority" || savedSortMode === "due" || savedSortMode === "urgency"
      ? savedSortMode
      : "manual";
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [quickMoveSourceId, setQuickMoveSourceId] = useState(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sortMode", sortMode);
  }, [sortMode]);

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

    setSortMode("manual");

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

  function startQuickMove(id) {
    setQuickMoveSourceId((prev) => (prev === id ? null : id));
  }

  function placeTaskRelative(sourceId, targetId, position) {
    const source = Number(sourceId);
    const target = Number(targetId);

    if (!source || !target || source === target) return;

    setSortMode("manual");

    setTasks((prevTasks) => {
      const ordered = [...prevTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const sourceIndex = ordered.findIndex((task) => task.id === source);
      if (sourceIndex < 0) return prevTasks;

      const next = [...ordered];
      const [moved] = next.splice(sourceIndex, 1);

      const targetIndex = next.findIndex((task) => task.id === target);
      if (targetIndex < 0) return prevTasks;

      const insertIndex = position === "above" ? targetIndex : targetIndex + 1;
      next.splice(insertIndex, 0, moved);

      const withOrder = next.map((task, idx) => ({ ...task, order: idx }));
      const byId = new Map(withOrder.map((task) => [task.id, task]));
      return prevTasks.map((task) => byId.get(task.id) ?? task);
    });

    setQuickMoveSourceId(null);
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

    return sortTasks(filteredTasks, sortMode);
  }, [tasks, filter, sortMode]);

  const sortLabels = {
    manual: "Manuale",
    urgency: "Urgenza",
    priority: "Priorità",
    due: "Scadenza",
  };

  function applySortMode(mode) {
    setSortMode(mode);
    setShowSortMenu(false);
  }

  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;
  const todo = total - completed;

  return (
    <main className="app">
      <div className="top-bar">
        <div className="title-with-help">
          <h1>Task Manager</h1>
          <button
            type="button"
            className="help-icon"
            onClick={() => setShowLegend((prev) => !prev)}
            aria-label="Mostra legenda"
            aria-expanded={showLegend}
            title="Mostra legenda"
          >
            ?
          </button>
          <div className={`help-popover${showLegend ? " open" : ""}`} role="status" aria-live="polite">
            <strong>Legenda</strong>
            <span>
              • Tocca il <span className="legend-inline-badge badge prio-medium">badge</span> per cambiare priorità
            </span>
            <span>• Tocca ✅/❌ per cambiare stato</span>
            <span>• Su mobile: Sposta → Sopra/Sotto</span>
            <span>• Su desktop: trascina per riordinare</span>
          </div>
        </div>

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

      <div className="view-bar">
        <TaskFilters filter={filter} setFilter={setFilter} />

        <div className="sort-control">
          <button
            type="button"
            onClick={() => setShowSortMenu((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={showSortMenu}
          >
            Ordina: {sortLabels[sortMode]}
          </button>
          {showSortMenu ? (
            <div className="sort-menu" role="menu" aria-label="Scegli ordinamento">
              <button type="button" className={sortMode === "manual" ? "active" : ""} onClick={() => applySortMode("manual")}>
                Manuale
              </button>
              <button type="button" className={sortMode === "urgency" ? "active" : ""} onClick={() => applySortMode("urgency")}>
                Urgenza
              </button>
              <button type="button" className={sortMode === "priority" ? "active" : ""} onClick={() => applySortMode("priority")}>
                Priorità
              </button>
              <button type="button" className={sortMode === "due" ? "active" : ""} onClick={() => applySortMode("due")}>
                Scadenza
              </button>
            </div>
          ) : null}
        </div>
      </div>

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
          onStartQuickMove={startQuickMove}
          onPlaceTaskRelative={placeTaskRelative}
          quickMoveSourceId={quickMoveSourceId}
          onDragStart={setDraggedTaskId}
          draggedTaskId={draggedTaskId}
          isManualSort={sortMode === "manual"}
        />
      )}
    </main>
  );
}