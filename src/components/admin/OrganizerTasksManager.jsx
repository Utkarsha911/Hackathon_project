import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { CheckSquare, Shield, Plus, Clock, AlertCircle, CheckCircle2, User, ExternalLink } from 'lucide-react';
import { downloadJsonFile } from '../../services/jsonExportService';

export default function OrganizerTasksManager() {
  const { orgTasks, departments, organizers, users, addOrgTask, updateOrgTaskStatus, showToast } = useHackathon();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const [newTaskData, setNewTaskData] = useState({
    task: '',
    description: '',
    department_id: departments[0]?.id || '',
    assigned_to: organizers[0]?.user_id || '',
    priority: 'high',
    deadline_date: '2026-11-13T18:00:00Z',
    link: ''
  });

  const filteredTasks = orgTasks.filter(t => 
    selectedDeptFilter === 'all' || t.department_id === selectedDeptFilter
  );

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskData.task) return;
    addOrgTask(newTaskData);
    setShowNewTaskModal(false);
    setNewTaskData({
      task: '',
      description: '',
      department_id: departments[0]?.id || '',
      assigned_to: organizers[0]?.user_id || '',
      priority: 'high',
      deadline_date: '2026-11-13T18:00:00Z',
      link: ''
    });
  };

  const handleExportTasks = () => {
    downloadJsonFile('org_tasks_private.json', orgTasks);
    showToast('Exported org_tasks.json successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Private Models: Department, Organizer, OrgTask (organizers.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Organizer Committee & Task Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Operational mission control across Tech, Logistics, Sponsorship, and Participant committees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTasks}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Export Tasks (JSON)
          </button>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white flex items-center gap-2 shadow-glow-purple transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Department Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedDeptFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDeptFilter === 'all'
              ? 'bg-purple-600 text-white shadow-glow-purple'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Committees ({orgTasks.length})
        </button>

        {departments.map((dept) => {
          const count = orgTasks.filter(t => t.department_id === dept.id).length;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptFilter(dept.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedDeptFilter === dept.id
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept.title.split('&')[0]} ({count})
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((t) => {
          const dept = departments.find(d => d.id === t.department_id) || { title: 'General Operations' };
          const assignee = users.find(u => u.id === t.assigned_to) || { first_name: 'Unassigned', last_name: '' };
          const isCompleted = t.status === 'completed';

          return (
            <div
              key={t.id}
              className={`glass-card p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCompleted ? 'border-slate-800/40 opacity-70' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    t.priority === 'urgent'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : t.priority === 'high'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    Priority: {t.priority}
                  </span>

                  <span className="text-xs text-purple-400 font-mono">
                    {dept.title}
                  </span>

                  <span className="text-[11px] font-mono text-slate-500">{t.id}</span>
                </div>

                <h4 className={`text-base font-bold text-white ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                  {t.task}
                </h4>

                {t.description && (
                  <p className="text-xs text-slate-400 mt-1">
                    {t.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assignee: <strong className="text-slate-200">{assignee.first_name} {assignee.last_name}</strong></span>
                  </div>

                  {t.deadline_date && (
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Deadline: {new Date(t.deadline_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {t.link && (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Work Artifact</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                {t.status !== 'pending' && (
                  <button
                    onClick={() => updateOrgTaskStatus(t.id, 'pending')}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Mark Pending
                  </button>
                )}
                {t.status !== 'in_progress' && (
                  <button
                    onClick={() => updateOrgTaskStatus(t.id, 'in_progress')}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900"
                  >
                    In Progress
                  </button>
                )}
                {t.status !== 'completed' && (
                  <button
                    onClick={() => updateOrgTaskStatus(t.id, 'completed')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Dispatch New Operational Task</h3>
            <p className="text-xs text-slate-400 mb-6">
              Assigned directly to organizer crew with deadline and department oversight.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Test audio system and HDMI splitters"
                  value={newTaskData.task}
                  onChange={(e) => setNewTaskData({ ...newTaskData, task: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Details & Action Items
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements or checklists..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={newTaskData.department_id}
                    onChange={(e) => setNewTaskData({ ...newTaskData, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
