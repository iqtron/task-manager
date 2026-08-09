import { useState } from "react";

export default function TaskForm({ onAddTask }) {
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onAddTask(text, dueDate);
    setText("");
    setDueDate("");
  }

  return (
    <form onSubmit={handleSubmit} className="add-row">
      <input
        type="text"
        placeholder="Nuova task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button type="submit">Aggiungi</button>
    </form>
  );
}