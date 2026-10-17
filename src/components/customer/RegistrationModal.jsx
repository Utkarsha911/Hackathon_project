import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { X, UserPlus, Shield, Flame } from 'lucide-react';

export default function RegistrationModal({ isOpen, onClose }) {
  const { registerTeam, hackathon } = useHackathon();

  const [formData, setFormData] = useState({
    teamName: '',
    college: '',
    projectTitle: '',
    track: 'Autonomous AI & HealthTech',
    githubRepo: '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
        <div className="p-6 sm:p-8">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-coral-500 flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-coral-600">
                Squad Enrollment
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Register for {hackathon?.title || 'BIC Hackathon'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Min {hackathon?.minimum_team_size || 2} – Max {hackathon?.max_team_size || 4} members.
              Public details are published to the leaderboard; medical & personal records are strictly private.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* SECTION 1: PUBLIC TEAM PROFILE */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-coral-700">
                  1. Team Profile
                </span>
                <span className="text-[10px] font-mono text-slate-600 px-2 py-0.5 rounded border border-slate-200 bg-white">
                  Public Model: Team
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Team / Squad Name *', key: 'teamName', type: 'text', placeholder: 'e.g. CyberVanguard', required: true },
                  { label: 'College / Institution *', key: 'college', type: 'text', placeholder: 'e.g. Pulchowk Campus, IOE', required: true },
                  { label: 'Project Title', key: 'projectTitle', type: 'text', placeholder: 'e.g. NeuroWatch AI' },
                  { label: 'GitHub Repo (optional)', key: 'githubRepo', type: 'url', placeholder: 'https://github.com/org/repo' },
                ].map(({ label, key, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-700 font-semibold mb-1.5">{label}</label>
                    <input
                      type={type}
                      required={required}
                      placeholder={placeholder}
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="bic-input"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-700 font-semibold mb-1.5">Challenge Track</label>
                  <select
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="bic-input"
                  >
                    <option value="Autonomous AI & HealthTech">Autonomous AI & HealthTech</option>
                    <option value="Fintech & Decentralized Trust">Fintech & Decentralized Trust</option>
                    <option value="Climate Intelligence & IoT">Climate Intelligence & IoT</option>
                    <option value="EdTech & Generative Tools">EdTech & Generative Tools</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: PRIVATE PARTICIPANT DETAILS */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Leader & Confidential Data
                  </span>
                </div>
                <span className="text-[10px] font-mono text-coral-700 px-2 py-0.5 rounded border border-coral-200 bg-coral-50 font-semibold">
                  Admin Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Team Leader Full Name *', key: 'leaderName', type: 'text', placeholder: 'e.g. Aarav Adhikari', required: true },
                  { label: 'Leader Email *', key: 'leaderEmail', type: 'email', placeholder: 'aarav@institute.edu', required: true },
                  { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+977-9800000000' },
                  { label: 'Resume / CV Drive Link', key: 'cvLink', type: 'url', placeholder: 'https://drive.google.com/...' },
                ].map(({ label, key, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-700 font-semibold mb-1.5">{label}</label>
                    <input
                      type={type}
                      required={required}
                      placeholder={placeholder}
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="bic-input"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs text-slate-700 font-semibold mb-1.5">Food Preference</label>
                  <select value={formData.foodPreference} onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value })} className="bic-input">
                    <option>Vegetarian</option>
                    <option>Non-veg</option>
                    <option>Vegan</option>
                    <option>Halal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 font-semibold mb-1.5">T-Shirt Size</label>
                  <select value={formData.tshirtSize} onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })} className="bic-input">
                    <option value="S">S – Small</option>
                    <option value="M">M – Medium</option>
                    <option value="L">L – Large</option>
                    <option value="XL">XL – Extra Large</option>
                    <option value="XXL">XXL – Double Extra Large</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-700 font-semibold mb-1.5">
                    Medical Information & Allergies (Private to Medical Staff)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Peanut allergy, Asthma inhaler carried (or 'None')"
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    className="bic-input"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-3 justify-center text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-[2] py-3 justify-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Submit Application</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
