import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StructuredData, Task, TaskStatus, Person, Project, Assignment } from '../types';
import { CheckIcon, AddIcon, DeleteIcon, CalendarIcon, SortIcon } from './IconComponents';

interface TaskViewProps {
  data: StructuredData;
  onUpdate: (newData: StructuredData) => void;
}

const statusOptions: TaskStatus[] = ['In-progress', 'Done', 'On-hold', 'Cancelled'];

// A smaller, self-contained component for the "Add Task" form.
const AddTaskForm: React.FC<{
    projects: Project[];
    people: Person[];
    onAddTask: (newTask: Omit<Task, 'id' | 'status' | 'progress'>, personId: string | null) => void;
    onCancel: () => void;
}> = ({ projects, people, onAddTask, onCancel }) => {
    const [name, setName] = useState('');
    const [projectId, setProjectId] = useState(projects[0]?.id || '');
    const [personId, setPersonId] = useState<string | null>(null);
    const [eta, setEta] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !projectId || !eta) {
            alert('Please fill all required fields.');
            return;
        }
        onAddTask({ name, projectId, eta }, personId);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-700/50 rounded-lg mb-6 border border-gray-600 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Task Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} required className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                <select value={personId ?? ''} onChange={e => setPersonId(e.target.value || null)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                    <option value="">Unassigned</option>
                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ETA</label>
                <input type="date" value={eta} onChange={e => setEta(e.target.value)} required className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
            </div>
            <div className="flex gap-2 md:col-start-5 md:justify-end">
                 <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md text-white font-semibold flex items-center gap-2 transition-colors">
                     <AddIcon className="w-4 h-4" /> Add
                 </button>
            </div>
        </form>
    );
};


export const TaskView: React.FC<TaskViewProps> = ({ data, onUpdate }) => {
  const [localData, setLocalData] = useState<StructuredData>(() => JSON.parse(JSON.stringify(data)));
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  const [filterProject, setFilterProject] = useState<string>('');
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortEta, setSortEta] = useState<'asc' | 'desc' | null>(null);
  
  useEffect(() => {
    // Re-initialize local state with a deep copy when the parent data prop changes.
    // A type assertion is used to ensure type safety after parsing.
    setLocalData(JSON.parse(JSON.stringify(data)) as StructuredData);
    setHasChanges(false);
  }, [data]);

  const findPersonForTask = useCallback((taskId: string): Person | undefined => {
    const assignment = localData.assignments.find(a => a.taskId === taskId);
    return assignment ? localData.people.find(p => p.id === assignment.personId) : undefined;
  }, [localData.assignments, localData.people]);

  const tasksWithDetails = useMemo(() => {
    return localData.tasks.map(task => ({
      ...task,
      project: localData.projects.find(p => p.id === task.projectId),
      assignedPerson: findPersonForTask(task.id)
    }));
  }, [localData.tasks, localData.projects, findPersonForTask]);

  const filteredTasks = useMemo(() => {
    let tasks = tasksWithDetails;

    if (filterProject) {
      tasks = tasks.filter(t => t.projectId === filterProject);
    }
    if (filterPerson) {
      tasks = tasks.filter(t => t.assignedPerson?.id === filterPerson);
    }
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.name.toLowerCase().includes(lowerCaseQuery) ||
        t.project?.name.toLowerCase().includes(lowerCaseQuery) ||
        t.assignedPerson?.name.toLowerCase().includes(lowerCaseQuery)
      );
    }
    if (sortEta) {
      tasks = [...tasks].sort((a, b) => {
        const dateA = new Date(a.eta).getTime();
        const dateB = new Date(b.eta).getTime();
        if (dateA === dateB) return a.name.localeCompare(b.name);
        return sortEta === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return tasks;
  }, [tasksWithDetails, filterProject, filterPerson, searchQuery, sortEta]);

  const handleTaskChange = <K extends keyof Task>(taskId: string, field: K, value: Task[K]) => {
    setLocalData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
    }));
    setHasChanges(true);
  };

  const handleAssignmentChange = (taskId: string, newPersonId: string | null) => {
    setLocalData(prev => {
      const otherAssignments = prev.assignments.filter(a => a.taskId !== taskId);
      if (newPersonId) {
        return {
          ...prev,
          assignments: [...otherAssignments, { taskId, personId: newPersonId }]
        };
      }
      return { ...prev, assignments: otherAssignments };
    });
    setHasChanges(true);
  };
  
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'status' | 'progress'>, personId: string | null) => {
      const newId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newTask: Task = {
        ...newTaskData,
        id: newId,
        status: 'In-progress',
        progress: 0,
      };
      const newAssignment: Assignment | undefined = personId ? { taskId: newId, personId } : undefined;
      
      setLocalData(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
        assignments: newAssignment ? [...prev.assignments, newAssignment] : prev.assignments,
      }));

      setHasChanges(true);
      setShowAddTaskForm(false);
  };

  const handleDeleteTask = (taskId: string) => {
      if (window.confirm("Are you sure you want to delete this task?")) {
        setLocalData(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId),
            assignments: prev.assignments.filter(a => a.taskId !== taskId),
        }));
        setHasChanges(true);
      }
  };

  const handleSaveChanges = () => {
    onUpdate(localData);
    setHasChanges(false);
  };
  
  const toggleSortEta = () => {
    setSortEta(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-600 pb-4">
            <h3 className="text-xl font-semibold text-cyan-300">Manage Tasks</h3>
            <div className="flex items-center gap-2">
                {hasChanges && (
                    <button
                        onClick={handleSaveChanges}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors duration-300 shadow-lg flex items-center gap-2"
                    >
                        <CheckIcon /> Save Changes
                    </button>
                )}
                <button
                    onClick={() => setShowAddTaskForm(prev => !prev)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-colors duration-300 flex items-center gap-2"
                >
                    <AddIcon /> {showAddTaskForm ? 'Cancel' : 'Add Task'}
                </button>
            </div>
        </div>
        
        {showAddTaskForm && (
            <AddTaskForm
                projects={localData.projects}
                people={localData.people}
                onAddTask={handleAddTask}
                onCancel={() => setShowAddTaskForm(false)}
            />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <select
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
                <option value="">All Projects</option>
                {localData.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
                value={filterPerson}
                onChange={e => setFilterPerson(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
                <option value="">All People</option>
                {localData.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 min-w-[200px]">Task Name</th>
                        <th scope="col" className="px-6 py-3">Project</th>
                        <th scope="col" className="px-6 py-3">Assigned To</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 w-40">Progress</th>
                        <th scope="col" className="px-6 py-3">
                            <button onClick={toggleSortEta} className="flex items-center gap-1 hover:text-white transition-colors">
                                ETA
                                {sortEta === 'asc' ? '▲' : sortEta === 'desc' ? '▼' : <SortIcon className="w-4 h-4" />}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTasks.map(task => (
                        <tr key={task.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                                <input type="text" value={task.name} onChange={e => handleTaskChange(task.id, 'name', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0"/>
                            </td>
                            <td className="px-6 py-4">{task.project?.name || 'N/A'}</td>
                            <td className="px-6 py-4">
                                <select value={task.assignedPerson?.id || ''} onChange={e => handleAssignmentChange(task.id, e.target.value || null)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:outline-none">
                                    <option value="">Unassigned</option>
                                    {localData.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <select value={task.status} onChange={e => handleTaskChange(task.id, 'status', e.target.value as TaskStatus)} className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:outline-none">
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <input type="range" min="0" max="100" value={task.progress} onChange={e => handleTaskChange(task.id, 'progress', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                    <span className="text-xs font-medium w-8 text-right">{task.progress}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <input type="date" value={task.eta} onChange={e => handleTaskChange(task.id, 'eta', e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 focus:ring-1 focus:ring-cyan-500 focus:outline-none"/>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-400" aria-label={`Delete task ${task.name}`}>
                                    <DeleteIcon />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredTasks.length === 0 && (
                <p className="text-center py-8 text-gray-500">No tasks match the current filters.</p>
            )}
        </div>
    </div>
  );
};