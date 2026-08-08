import TaskItem from "./TaskItem";

function TaskList({ tasks, onToggle, onDelete, onEdit, onPriorityChange }) {
  if (tasks.length === 0) {
    return <p>Nessuna task da mostrare.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onPriorityChange={onPriorityChange}
        />
      ))}
    </ul>
  );
}

export default TaskList;