import { useState } from "react";

// Form semplice per creare una nuova task con testo e scadenza opzionale.
export default function TaskForm({ onAddTask }) {
  // Il testo della nuova task e la sua eventuale scadenza.
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Invia il form solo se il testo non è vuoto, poi pulisce i campi.
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
      <button type="submit" className="add-button">Aggiungi</button>
    </form>
  );
}