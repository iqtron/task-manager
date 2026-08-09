import TaskItem from "./TaskItem";

function TaskList({ tasks, onToggle, onDelete, onEdit, onPriorityChange, onReorderTask, onMoveTask, onStartQuickMove, onPlaceTaskRelative, quickMoveSourceId, onDragStart, draggedTaskId }) {
  if (tasks.length === 0) {
    return <p>Nessuna task da mostrare.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          total={tasks.length}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onPriorityChange={onPriorityChange}
          onReorderTask={onReorderTask}
          onMoveTask={onMoveTask}
          onStartQuickMove={onStartQuickMove}
          onPlaceTaskRelative={onPlaceTaskRelative}
          quickMoveSourceId={quickMoveSourceId}
          onDragStart={onDragStart}
          isDragging={draggedTaskId === task.id}
          draggedTaskId={draggedTaskId}
        />
      ))}
    </ul>
  );
}

export default TaskList;