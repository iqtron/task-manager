import TaskItem from "./TaskItem";

function TaskList({ tasks, onToggle, onDelete, onEdit, onPriorityChange, onReorderTask, onDragStart, draggedTaskId }) {
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
          onReorderTask={onReorderTask}
          onDragStart={onDragStart}
          isDragging={draggedTaskId === task.id}
          draggedTaskId={draggedTaskId}
        />
      ))}
    </ul>
  );
}

export default TaskList;