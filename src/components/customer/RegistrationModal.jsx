import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { X, UserPlus, Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function RegistrationModal({ isOpen, onClose }) {
  const { registerTeam, hackathon } = useHackathon();

  const [formData, setFormData] = useState({
    teamName: '',
    college: '',
    projectTitle: '',
    track: 'Autonomous AI & HealthTech',
    githubRepo: '',
    // Leader & Private Participant details
    leaderName: '',
    leaderEmail: '',
    phone: '',
    foodPreference: 'Vegetarian',
    tshirtSize: 'L',
    medications: '',
    cvLink: '',
    githubLink: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.teamName || !formData.leaderName || !formData.leaderEmail) return;
    registerTeam(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card w-full max-w-2xl rounded-3xl border-slate-700 p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Squad Enrollment</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Register for {hackathon.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Min {hackathon.minimum_team_size || 2} - Max {hackathon.max_team_size || 4} members. Public details are published to the leaderboard; medical & personal records are strictly private.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: PUBLIC TEAM PROFILE */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1. Team Profile (Public Model: Team)
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                Normal Visibility
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Team / Squad Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberVanguard"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  College / Institution *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pulchowk Campus, IOE"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Target Challenge Track
                </label>
                <select
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-cyan-500 outline-none"
                >
                  <option value="Autonomous AI & HealthTech">Autonomous AI & HealthTech</option>
                  <option value="Fintech & Decentralized Trust">Fintech & Decentralized Trust</option>
                  <option value="Climate Intelligence & IoT">Climate Intelligence & IoT</option>
                  <option value="EdTech & Generative Tools">EdTech & Generative Tools</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Public GitHub Repo Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PRIVATE PARTICIPANT & SENSITIVE DETAILS */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-900/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                2. Leader & Confidential Data (Private Models: User & Participant)
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Admin Panel Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Team Leader Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Adhikari"
                  value={formData.leaderName}
                  onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Leader Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="aarav@institute.edu"
                  value={formData.leaderEmail}
                  onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+977-9800000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Food Preference (For 48h Catering)
                </label>
                <select
                  value={formData.foodPreference}
                  onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-veg">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Halal">Halal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  T-Shirt Size
                </label>
                <select
                  value={formData.tshirtSize}
                  onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="S">S - Small</option>
                  <option value="M">M - Medium</option>
                  <option value="L">L - Large</option>
                  <option value="XL">XL - Extra Large</option>
                  <option value="XXL">XXL - Double Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Resume / CV Drive Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.cvLink}
                  onChange={(e) => setFormData({ ...formData, cvLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Medical Information & Allergies (Private to Medical Staff)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Peanut allergy, Asthma inhaler carried (or leave 'None')"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-xs text-slate-400 bg-slate-900 border border-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Submit Application</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
