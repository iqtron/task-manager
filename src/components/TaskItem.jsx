import { useState } from "react";

function TaskItem({ task, onToggle, onDelete, onEdit, onPriorityChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);

  function startEdit() {
    setDraftText(task.text);
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraftText(task.text);
    setIsEditing(false);
  }

  function saveEdit() {
    const text = draftText.trim();
    if (!text) return;
    onEdit(task.id, text);
    setIsEditing(false);
  }

  const priorityClass =
    task.priority === "alta"
      ? "prio-high"
      : task.priority === "media"
      ? "prio-medium"
      : "prio-low";

  return (
    <li className="task-item">
      {isEditing ? (
        <>
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
          />
          <button onClick={saveEdit}>Salva</button>
          <button onClick={cancelEdit}>Annulla</button>
        </>
      ) : (
        <>
          <span className={task.done ? "task-text done" : "task-text"}>
            {task.text}
          </span>

          <span className={`badge ${priorityClass}`}>{task.priority}</span>
          <span className="status">{task.done ? "✅" : "❌"}</span>

          <select
            value={task.priority}
            onChange={(e) => onPriorityChange(task.id, e.target.value)}
            title="Cambia priorità"
          >
            <option value="bassa">Bassa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          <button onClick={() => onToggle(task.id)}>Toggle</button>
          <button onClick={startEdit}>Modifica</button>
          <button className="danger" onClick={() => onDelete(task.id)}>
            Elimina
          </button>
        </>
      )}
    </li>
  );
}

export default TaskItem;