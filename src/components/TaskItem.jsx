import { useState } from "react";

function parseDate(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "Nessuna scadenza";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function isOverdue(value, done) {
  if (!value || done) return false;

  const dueDate = parseDate(value);
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function getDueStatus(value, done) {
  if (!value || done) return null;

  const dueDate = parseDate(value);
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dueDate < today) return { label: "In ritardo", className: "status-overdue" };
  if (dueDate.getTime() === today.getTime()) return { label: "Scade oggi", className: "status-today" };
  if (dueDate.getTime() === tomorrow.getTime()) return { label: "Scade domani", className: "status-tomorrow" };

  return null;
}

function TaskItem({ task, index, total, onToggle, onDelete, onEdit, onPriorityChange, onReorderTask, onMoveTask, onStartQuickMove, onPlaceTaskRelative, quickMoveSourceId, onDragStart, isDragging, draggedTaskId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);
  const [draftDueDate, setDraftDueDate] = useState(task.dueDate ?? "");

  function startEdit() {
    setDraftText(task.text);
    setDraftDueDate(task.dueDate ?? "");
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraftText(task.text);
    setDraftDueDate(task.dueDate ?? "");
    setIsEditing(false);
  }

  function saveEdit() {
    const text = draftText.trim();
    if (!text) return;
    onEdit(task.id, text, draftDueDate);
    setIsEditing(false);
  }

  const priorityClass =
    task.priority === "alta"
      ? "prio-high"
      : task.priority === "media"
      ? "prio-medium"
      : "prio-low";

  const overdue = isOverdue(task.dueDate, task.done);
  const dueStatus = getDueStatus(task.dueDate, task.done);
  const dueLabel = task.dueDate ? `Scadenza: ${formatDate(task.dueDate)}` : "Nessuna scadenza";
  const isQuickMoveSource = quickMoveSourceId === task.id;
  const isQuickMoveActive = quickMoveSourceId !== null;

  return (
    <li
      className={`task-item${overdue ? " overdue" : ""}${isDragging ? " dragging" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(task.id));
        onDragStart(task.id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const sourceId = event.dataTransfer.getData("text/plain");
        onReorderTask?.(sourceId, task.id);
      }}
      onDragEnd={() => onDragStart(null)}
    >
      {isEditing ? (
        <>
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
          />
          <input
            type="date"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
          />
          <button onClick={saveEdit}>Salva</button>
          <button onClick={cancelEdit}>Annulla</button>
        </>
      ) : (
        <>
          <span className={task.done ? "task-text done" : "task-text"}>
            {task.text}
          </span>
          <div className="task-controls-row">
            <label className={`priority-picker badge ${priorityClass}`} title="Cambia priorità">
              {task.priority}
              <select
                value={task.priority}
                onChange={(e) => onPriorityChange(task.id, e.target.value)}
                aria-label="Cambia priorità"
              >
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </label>
            <span className={`due-date${overdue ? " overdue" : ""}`}>{dueLabel}</span>
            {dueStatus ? <span className={`due-badge ${dueStatus.className}`}>{dueStatus.label}</span> : null}
            {overdue && !dueStatus ? <span className="due-badge status-overdue">In ritardo</span> : null}
            <span
              className="status status-toggle"
              onClick={() => onToggle(task.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggle(task.id);
                }
              }}
              role="button"
              tabIndex={0}
              title="Segna come completata o da fare"
            >
              {task.done ? "✅" : "❌"}
            </span>

            <span className="drag-hint">⋮⋮</span>
            <button
              type="button"
              className={`quick-move-trigger${isQuickMoveSource ? " quick-move-active" : ""}`}
              onClick={() => onStartQuickMove?.(task.id)}
              title="Seleziona task da spostare"
            >
              {isQuickMoveSource ? "Sposta: selezionata" : "Sposta"}
            </button>
            {isQuickMoveActive && !isQuickMoveSource ? (
              <div className="quick-move-target" aria-label="Posizione destinazione">
                <button
                  type="button"
                  onClick={() => onPlaceTaskRelative?.(quickMoveSourceId, task.id, "above")}
                  title="Posiziona sopra questa task"
                >
                  Sopra qui
                </button>
                <button
                  type="button"
                  onClick={() => onPlaceTaskRelative?.(quickMoveSourceId, task.id, "below")}
                  title="Posiziona sotto questa task"
                >
                  Sotto qui
                </button>
              </div>
            ) : null}
            <div className="move-buttons" aria-label="Riordina task">
              <button
                type="button"
                onClick={() => onMoveTask?.(task.id, "up")}
                disabled={index === 0}
                title="Sposta su"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveTask?.(task.id, "down")}
                disabled={index === total - 1}
                title="Sposta giù"
              >
                ↓
              </button>
            </div>
            <button onClick={startEdit}>Modifica</button>
            <button className="danger" onClick={() => onDelete(task.id)}>
              Elimina
            </button>
          </div>
        </>
      )}
    </li>
  );
}

export default TaskItem;