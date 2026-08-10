import { useEffect, useMemo, useRef, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import TaskFilters from "./components/TaskFilters";
import "./App.css";

// Helper condiviso per lavorare sempre con la data di oggi senza ore/minuti/secondi.
function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDateOffset(daysOffset) {
  const date = getStartOfToday();
  date.setDate(date.getDate() + daysOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Crea una lista di esempio con priorità, scadenze e stato iniziale.
function createDemoTasks() {
  return [
    {
      id: 1,
      text: "Prenotare un appuntamento",
      done: false,
      priority: "alta",
      dueDate: formatDateOffset(-1),
      order: 0,
    },
    {
      id: 2,
      text: "Organizzare la spesa della settimana",
      done: false,
      priority: "media",
      dueDate: formatDateOffset(0),
      order: 1,
    },
    {
      id: 3,
      text: "Rispondere a un messaggio importante",
      done: false,
      priority: "alta",
      dueDate: formatDateOffset(1),
      order: 2,
    },
    {
      id: 4,
      text: "Pagare una bolletta",
      done: true,
      priority: "bassa",
      dueDate: formatDateOffset(4),
      order: 3,
    },
    {
      id: 5,
      text: "Sistemare la scrivania",
      done: false,
      priority: "bassa",
      dueDate: null,
      order: 4,
    },
    {
      id: 6,
      text: "Ritirare un pacco",
      done: true,
      priority: "media",
      dueDate: null,
      order: 5,
    },
    {
      id: 7,
      text: "Chiamare un amico",
      done: false,
      priority: "alta",
      dueDate: formatDateOffset(-3),
      order: 6,
    },
    {
      id: 8,
      text: "Comprare un regalo",
      done: false,
      priority: "media",
      dueDate: null,
      order: 7,
    },
    {
      id: 9,
      text: "Fare una passeggiata",
      done: true,
      priority: "alta",
      dueDate: formatDateOffset(2),
      order: 8,
    },
    {
      id: 10,
      text: "Riordinare i documenti",
      done: false,
      priority: "bassa",
      dueDate: formatDateOffset(6),
      order: 9,
    },
  ];
}

const demoTasks = createDemoTasks();

// Assicura che i dati caricati da localStorage abbiano sempre la forma attesa.
function normalizeTasks(value) {
  if (!Array.isArray(value)) return demoTasks;

  return value.map((task, index) => ({
    ...task,
    dueDate: task.dueDate ?? null,
    order: typeof task.order === "number" ? task.order : index,
  }));
}

// Trasforma una stringa YYYY-MM-DD in un oggetto Date leggibile.
function parseDate(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

// Indica se una task è scaduta e ancora da completare.
function isOverdue(value, done) {
  if (!value || done) return false;

  const dueDate = parseDate(value);
  if (!dueDate) return false;

  const today = getStartOfToday();

  return dueDate < today;
}

// Indica se una task è in scadenza entro una settimana.
function isDueSoon(value, done) {
  if (!value || done) return false;

  const dueDate = parseDate(value);
  if (!dueDate) return false;

  const today = getStartOfToday();

  const weekLater = new Date(today);
  weekLater.setDate(today.getDate() + 7);

  return dueDate >= today && dueDate <= weekLater;
}

// Assegna un valore numerico alle priorità per ordinare in modo semplice.
function getPriorityRank(priority) {
  if (priority === "alta") return 0;
  if (priority === "media") return 1;
  return 2;
}

// Assegna un livello di urgenza in base alla scadenza della task.
function getDueRank(task) {
  if (!task.dueDate || task.done) return 4;
  if (isOverdue(task.dueDate, task.done)) return 0;

  const dueDate = parseDate(task.dueDate);
  if (!dueDate) return 4;

  const today = getStartOfToday();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dueDate.getTime() === today.getTime()) return 1;
  if (dueDate.getTime() === tomorrow.getTime()) return 2;
  if (isDueSoon(task.dueDate, task.done)) return 3;
  return 4;
}

// Ordina le task in base al metodo selezionato: manuale, priorità o scadenza.
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

// Componente principale: contiene stato, filtri, ordinamento e azioni globali.
export default function App() {
  // Carica le task salvate nel browser, oppure usa il demo iniziale.
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("tasks");
      return saved ? normalizeTasks(JSON.parse(saved)) : demoTasks;
    } catch {
      return demoTasks;
    }
  });

  // Gestisce il filtro visibile nella lista.
  const [filter, setFilter] = useState("all");
  // Mostra o nasconde la legenda informativa dell'interfaccia.
  const [showLegend, setShowLegend] = useState(false);
  // Memorizza il metodo di ordinamento corrente.
  const [sortMode, setSortMode] = useState(() => {
    if (typeof window === "undefined") return "manual";

    const savedSortMode = localStorage.getItem("sortMode");
    return savedSortMode === "manual" || savedSortMode === "priority" || savedSortMode === "due" || savedSortMode === "urgency"
      ? savedSortMode
      : "manual";
  });
  // Controlla se il menu di ordinamento è aperto.
  const [showSortMenu, setShowSortMenu] = useState(false);
  // Gestisce il tema chiaro/scuro salvato tra le sessioni.
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  // Mantiene l'ID della task trascinata per il drag-and-drop.
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  // Serve al quick-move mobile per capire da quale task iniziare lo spostamento.
  const [quickMoveSourceId, setQuickMoveSourceId] = useState(null);
  // Riferimento all'input nascosto usato per importare un file JSON.
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

  // Aggiunge una nuova task in cima alla lista e la prepara per la visualizzazione.
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

  // Cambia lo stato di completamento di una task.
  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  // Elimina una task dopo conferma dell'utente.
  function deleteTask(id) {
    const ok = window.confirm("Vuoi davvero eliminare questa task?");
    if (!ok) return;

    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  // Modifica il testo e la scadenza di una task esistente.
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

  // Aggiorna la priorità di una task.
  function changePriority(id, newPriority) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, priority: newPriority } : task
      )
    );
  }

  // Ripristina i dati demo e resetta le impostazioni di vista.
  function resetTasks() {
    const ok = window.confirm("Vuoi ripristinare le task demo per il testing?");
    if (!ok) return;
    setTasks(createDemoTasks());
    setFilter("all");
    setSortMode("manual");
    setShowSortMenu(false);
    setShowLegend(false);
    setQuickMoveSourceId(null);
    setDraggedTaskId(null);
  }

  // Svuota completamente la lista dopo conferma.
  function clearTasks() {
    const ok = window.confirm("Vuoi svuotare tutte le task e partire da zero?");
    if (!ok) return;

    setTasks([]);
    setFilter("all");
    setSortMode("manual");
    setShowSortMenu(false);
    setShowLegend(false);
    setQuickMoveSourceId(null);
    setDraggedTaskId(null);
  }

  // Alterna tra tema chiaro e scuro.
  function toggleTheme() {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }

  // Riordina due task tramite drag-and-drop nella vista manuale.
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

  // Seleziona una task per lo spostamento rapido su mobile.
  function startQuickMove(id) {
    setQuickMoveSourceId((prev) => (prev === id ? null : id));
  }

  // Inserisce una task sopra o sotto un'altra in modalità quick-move.
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

  // Esporta l'intera lista in un file JSON scaricabile.
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

  // Importa una lista di task da un file JSON.
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

  // Restituisce la lista effettivamente visibile dopo filtro e ordinamento.
  const visibleTasks = useMemo(() => {
    const filteredTasks =
      filter === "due-soon"
        ? tasks.filter((task) => isDueSoon(task.dueDate, task.done))
        : filter === "overdue"
        ? tasks.filter((task) => isOverdue(task.dueDate, task.done))
        : tasks;

    return sortTasks(filteredTasks, sortMode);
  }, [tasks, filter, sortMode]);

  // Testi mostrati nel menu di ordinamento.
  const sortLabels = {
    manual: "Manuale",
    urgency: "Urgenza",
    priority: "Priorità",
    due: "Scadenza",
  };

  // Applica un nuovo metodo di ordinamento e chiude il menu.
  function applySortMode(mode) {
    setSortMode(mode);
    setShowSortMenu(false);
  }

  // Statistiche rapide per la barra informativa.
  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;
  const todo = total - completed;

  return (
    <main className="app">
      <div className="top-bar">
        <div className="title-with-help">
          <div className="title-block">
            <h1>Task Manager</h1>
            <p className="title-subtitle">Organizza, ordina e completa con priorita e scadenze.</p>
          </div>
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
          <button type="button" className="action-theme" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Modalità chiara" : "🌙 Modalità scura"}
          </button>
          <button type="button" className="action-ghost" onClick={exportTasks}>
            Esporta JSON
          </button>
          <button type="button" className="action-ghost" onClick={() => importInputRef.current?.click()}>
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

      <p className="stats-line">
        Totali: <strong>{total}</strong> · Completate: <strong>{completed}</strong> · Da fare: <strong>{todo}</strong>
      </p>

      <div className="reset-actions">
        <button className="danger" onClick={resetTasks}>
          Ripristina demo
        </button>
        <button className="danger secondary" onClick={clearTasks}>
          Svuota tutto
        </button>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="empty-state" role="status" aria-live="polite">
          <h2>{total === 0 ? "Nessuna task presente" : "Nessuna task con questo filtro"}</h2>
          <p>
            {total === 0
              ? "Inizia aggiungendo la prima task oppure ripristina una demo di esempio."
              : "Prova a cambiare filtro o riporta la vista su Tutte per vedere di nuovo la lista."}
          </p>
          <div className="empty-actions">
            {total === 0 ? (
              <button type="button" onClick={resetTasks}>Ripristina demo</button>
            ) : (
              <button type="button" onClick={() => setFilter("all")}>Mostra tutte</button>
            )}
          </div>
        </div>
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