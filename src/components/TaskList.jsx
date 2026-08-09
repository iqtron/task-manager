import { useAutoAnimate } from "@formkit/auto-animate/react";
import TaskItem from "./TaskItem";

function TaskList({ tasks, onToggle, onDelete, onEdit, onPriorityChange, onReorderTask, onStartQuickMove, onPlaceTaskRelative, quickMoveSourceId, onDragStart, draggedTaskId, isManualSort }) {
  const [listRef] = useAutoAnimate({ duration: 220, easing: "ease-in-out" });

  if (tasks.length === 0) {
    return <p>Nessuna task da mostrare.</p>;
  }

  return (
    <ul ref={listRef} className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onPriorityChange={onPriorityChange}
          onReorderTask={onReorderTask}
          onStartQuickMove={onStartQuickMove}
          onPlaceTaskRelative={onPlaceTaskRelative}
          quickMoveSourceId={quickMoveSourceId}
          onDragStart={onDragStart}
          isDragging={draggedTaskId === task.id}
          draggedTaskId={draggedTaskId}
          isManualSort={isManualSort}
        />
      ))}
    </ul>
  );
}

export default TaskList;