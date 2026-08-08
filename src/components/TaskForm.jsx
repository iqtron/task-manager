import { useState } from "react";

export default function TaskForm({ onAddTask }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onAddTask(text);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nuova task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit">Aggiungi</button>
    </form>
  );
}