import React, { useRef, useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useGlobalStore } from '../../../core/state/GlobalStore';
import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiClock } from 'react-icons/fi';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, style: React.CSSProperties) => React.ReactNode;
  itemSize?: number | ((index: number) => number);
  overscanCount?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemSize = 60,
  overscanCount = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);
  const sizeMap = useRef<Map<number, number>>(new Map());
  const [measured, setMeasured] = useState(false);

  const getItemSize = (index: number) => {
    return sizeMap.current.get(index) || (typeof itemSize === 'number' ? itemSize : itemSize(index));
  };

  const measureItem = (index: number, size: number) => {
    sizeMap.current.set(index, size);
    listRef.current?.resetAfterIndex(index);
  };

  useEffect(() => {
    if (items.length > 0 && !measured) {
      setMeasured(true);
      listRef.current?.resetAfterIndex(0);
    }
  }, [items, measured]);

  return (
    <div className={`flex-1 ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={getItemSize}
            overscanCount={overscanCount}
          >
            {({ index, style }) => (
              <div style={style}>
                {React.cloneElement(renderItem(items[index], style) as React.ReactElement, {
                  ref: (el: HTMLElement | null) => {
                    if (el) {
                      measureItem(index, el.getBoundingClientRect().height);
                    }
                  }
                }}
              </div>
            )}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

// Przykładowe użycie dla listy zadań
export function TaskVirtualList() {
  const { tasks, updateTask } = useGlobalStore();
  
  return (
    <VirtualizedList
      items={tasks}
      itemSize={(index) => tasks[index].description ? 80 : 60}
      renderItem={(task, style) => (
        <motion.div
          key={task.id}
          style={style}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 border-b border-ifciu-tertiaryBg hover:bg-ifciu-secondaryBg transition-colors"
        >
          <div className="flex items-center">
            <button
              onClick={() => updateTask(task.id, { completed: !task.completed })}
              className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center 
                ${task.completed ? 'bg-ifciu-success' : 'border border-ifciu-textSecondary'}`}
            >
              {task.completed && <FiCheck className="text-white" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`truncate ${task.completed ? 'line-through text-ifciu-textSecondary' : ''}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-ifciu-textSecondary truncate mt-1">
                  {task.description}
                </p>
              )}
            </div>
            
            {task.priority === 'high' && (
              <FiStar className="text-ifciu-warning ml-2" />
            )}
            
            {task.dueDate && new Date(task.dueDate) < new Date() && !task.completed && (
              <FiClock className="text-ifciu-error ml-2" />
            )}
          </div>
        </motion.div>
      )}
    />
  );
}