import React from 'react';
import { useGlobalStore } from '../../../core/state/GlobalStore';
import GlassCard from '../../../ui/components/layout/GlassCard';
import { Task, TaskPriority } from '../types/TaskTypes';
import { motion } from 'framer-motion';
import { FiCheck, FiClock, FiAlertTriangle, FiCalendar } from 'react-icons/fi';

const priorityColors = {
  [TaskPriority.HIGH]: 'bg-ifciu-error',
  [TaskPriority.MEDIUM]: 'bg-ifciu-warning',
  [TaskPriority.LOW]: 'bg-ifciu-accentSecondary',
};

const TaskMatrix: React.FC = () => {
  const { tasks, updateTask } = useGlobalStore();
  
  const handleTaskComplete = (taskId: string) => {
    updateTask(taskId, { completed: true, completedAt: new Date() });
  };

  const getTasksByQuadrant = (urgent: boolean, important: boolean) => {
    return tasks.filter(task => 
      !task.completed &&
      task.urgent === urgent && 
      task.important === important
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Quadrant 1: Urgent & Important */}
      <GlassCard className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-3 h-3 rounded-full ${priorityColors[TaskPriority.HIGH]} mr-2`} />
          <h3 className="font-semibold">Pilne & Ważne</h3>
        </div>
        <div className="space-y-2">
          {getTasksByQuadrant(true, true).map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center p-3 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg cursor-pointer"
              onClick={() => handleTaskComplete(task.id)}
            >
              <div className="flex-1">
                <p className="font-medium">{task.title}</p>
                {task.dueDate && (
                  <div className="flex items-center text-xs text-ifciu-textSecondary mt-1">
                    <FiCalendar className="mr-1" />
                    {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                  </div>
                )}
              </div>
              <FiCheck className="text-ifciu-success" />
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Quadrant 2: Not Urgent & Important */}
      <GlassCard className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-3 h-3 rounded-full ${priorityColors[TaskPriority.MEDIUM]} mr-2`} />
          <h3 className="font-semibold">Niepilne & Ważne</h3>
        </div>
        <div className="space-y-2">
          {getTasksByQuadrant(false, true).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </GlassCard>

      {/* Quadrant 3: Urgent & Not Important */}
      <GlassCard className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-3 h-3 rounded-full ${priorityColors[TaskPriority.LOW]} mr-2`} />
          <h3 className="font-semibold">Pilne & Nieważne</h3>
        </div>
        <div className="space-y-2">
          {getTasksByQuadrant(true, false).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </GlassCard>

      {/* Quadrant 4: Not Urgent & Not Important */}
      <GlassCard className="p-4">
        <div className="flex items-center mb-3">
          <FiClock className="text-ifciu-textSecondary mr-2" />
          <h3 className="font-semibold">Niepilne & Nieważne</h3>
        </div>
        <div className="space-y-2">
          {getTasksByQuadrant(false, false).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { updateTask } = useGlobalStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center p-3 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg cursor-pointer"
      onClick={() => updateTask(task.id, { urgent: !task.urgent })}
    >
      <div className="flex-1">
        <p className="font-medium">{task.title}</p>
        {task.linkedGoal && (
          <div className="text-xs text-ifciu-accentPrimary mt-1">
            #{task.linkedGoal}
          </div>
        )}
      </div>
      {task.dueSoon && (
        <FiAlertTriangle className="text-ifciu-warning" />
      )}
    </motion.div>
  );
};

export default TaskMatrix;