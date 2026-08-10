// Barra dei filtri per vedere solo task in scadenza, scadute o tutte.
function TaskFilters({ filter, setFilter }) {
  return (
    <div className="filters">
      <button
        className={filter === "all" ? "active" : ""}
        onClick={() => setFilter("all")}
      >
        Tutte
      </button>

      <button
        className={filter === "due-soon" ? "active" : ""}
        onClick={() => setFilter("due-soon")}
      >
        In scadenza
      </button>

      <button
        className={filter === "overdue" ? "active" : ""}
        onClick={() => setFilter("overdue")}
      >
        Scadute
      </button>
    </div>
  );
}

export default TaskFilters;