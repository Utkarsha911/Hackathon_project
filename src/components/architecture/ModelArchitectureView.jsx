import React, { useState } from 'react';
import { BACKEND_MODELS, MODEL_VISIBILITY, getNormalModels, getPrivateModels } from '../../models/modelRegistry';
import { 
  FolderTree, 
  Layers, 
  Lock, 
  Globe, 
  Database, 
  FileCode, 
  CheckCircle2, 
  ArrowRight,
  Download
} from 'lucide-react';
import { bundleDatasetsByScope, downloadJsonFile } from '../../services/jsonExportService';
import { useHackathon } from '../../context/HackathonContext';

export default function ModelArchitectureView() {
  const { allDataStore, showToast } = useHackathon();
  const [activeTab, setActiveTab] = useState('models'); // 'models' | 'structure' | 'comparison'

  const normalModels = getNormalModels();
  const privateModels = getPrivateModels();

  const handleDownloadFullSnapshot = () => {
    const fullBundle = bundleDatasetsByScope(allDataStore, 'all');
    downloadJsonFile('bic_hackathon_full_architecture_export.json', fullBundle);
    showToast('Downloaded full database export bundle successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-3">
              <Database className="w-3.5 h-3.5" />
              <span>Backend Architecture & Model Mapping</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              Data Model & Folder Structure Blueprint
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Derived directly from <strong className="text-cyan-400">bic_hackathon_design</strong> backend models. Strictly partitions sensitive financial, medical, and operational models to the Admin Panel, while projecting normal public models to the Customer-Facing portal.
            </p>
          </div>

          <button
            onClick={handleDownloadFullSnapshot}
            className="px-5 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:shadow-glow-cyan flex items-center gap-2 shrink-0 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download All Datasets (JSON)</span>
          </button>
        </div>

        {/* View Switcher Pills */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-2">
          {[
            { id: 'models', label: 'Models Categorization Matrix', icon: Layers },
            { id: 'structure', label: 'File & Folder Structure', icon: FolderTree },
            { id: 'comparison', label: 'Normal vs Private Comparison', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: MODELS CATEGORIZATION MATRIX */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Normal Models (Customer Facing) */}
          <div className="glass-card p-6 rounded-3xl border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Normal Models</h3>
                    <span className="text-xs text-cyan-400 font-semibold uppercase">Customer Facing (Public)</span>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-400 font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  {normalModels.length} Models
                </span>
              </div>

              <div className="space-y-4">
                {normalModels.map((m) => (
                  <div key={m.name} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {m.tableName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{m.description}</p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      Source: {m.sourceFile}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Private Models (Admin Panel Only) */}
          <div className="glass-card p-6 rounded-3xl border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Private Models</h3>
                    <span className="text-xs text-amber-400 font-semibold uppercase">Admin Panel Only (Confidential)</span>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-400 font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  {privateModels.length} Models
                </span>
              </div>

              <div className="space-y-4">
                {privateModels.map((m) => (
                  <div key={m.name} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <span className="font-mono text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                        {m.tableName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{m.description}</p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      Source: {m.sourceFile}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: FILE & FOLDER STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="glass-card p-8 rounded-3xl border-slate-800 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-cyan-400" />
              <span>Configured Frontend Architecture</span>
            </h3>
            <span className="text-slate-400 font-mono">React 19 + Tailwind CSS + JSX</span>
          </div>

          <pre className="text-cyan-300 bg-[#060a12] p-6 rounded-2xl overflow-x-auto leading-relaxed border border-slate-800">
{`bic_hackathon_frontend/
├── index.html                   # HTML entry point with dark cyber aesthetics & Google Fonts
├── vite.config.js               # Vite config with React JSX compiler
├── tailwind.config.js           # Tailwind theme tokens (glows, cyber palettes, custom borders)
├── postcss.config.js            # PostCSS plugin pipeline
├── package.json                 # Pure JavaScript React dependencies (Lucide icons, Tailwind)
│
└── src/
    ├── index.css                # Tailwind base, utilities, custom glassmorphism & glows
    ├── main.jsx                 # Application entry point mounting HackathonProvider
    ├── App.jsx                  # Root layout switcher (Customer Facing vs Admin vs Schema)
    │
    ├── models/                  # Direct mapping of backend models from bic_hackathon_design
    │   └── modelRegistry.js     # Registry defining Normal vs Private models, tables & fields
    │
    ├── services/                # Data serialization and file export engine
    │   └── jsonExportService.js # Export individual models, public/private bundles, or full JSON DB
    │
    ├── context/                 # Centralized state management
    │   └── HackathonContext.jsx # Live mutations (registrations, tasks, checkins, sponsorships)
    │
    ├── data/
    │   └── json/                # Raw JSON database files matching backend tables
    │       ├── hackathon.json           [Normal] Event dates, theme, rules, metadata
    │       ├── prizes.json              [Normal] Prize bounties, cash awards, perks
    │       ├── challenges.json          [Normal] Problem statements & track prompts
    │       ├── schedules.json           [Normal] 48-hour sprint milestone schedule
    │       ├── schedule_events.json     [Normal] Specific workshops, keynotes & demos
    │       ├── sponsors.json            [Normal] Public partner logos, descriptions, links
    │       ├── faqs.json                [Normal] Applicant FAQ questions & answers
    │       ├── contact_us.json          [Normal] Public organizer contact messages
    │       ├── terms.json               [Normal] Terms & conditions, code of conduct
    │       ├── teams.json               [Normal] Public squad directory & repo links
    │       │
    │       ├── sponsorships.json        [Private] Paid vs pledged funds & contract notes
    │       ├── departments.json         [Private] Organizing committees (Tech, Logistics, PR)
    │       ├── organizers.json          [Private] Staff duty positions & shifts
    │       ├── org_tasks.json           [Private] Internal task board, priorities, assignees
    │       ├── users.json               [Private] User accounts, password hashes, phone, roles
    │       ├── roles.json               [Private] Access role permissions
    │       ├── participants.json        [Private] Health, medications, diets, CV links, sizes
    │       ├── team_members.json        [Private] Squad roster mapping & roles
    │       ├── registrations.json       [Private] Team review status & decisions
    │       ├── check_ins.json           [Private] On-site desk check-in timestamps
    │       ├── tables.json              [Private] Venue workstation desk & hall allocations
    │       └── notifications.json       [Private] Internal broadcast alerts
    │
    └── components/
        ├── common/
        │   ├── Navbar.jsx               # View switcher (Customer vs Admin vs Schema)
        │   ├── Footer.jsx               # Universal footer
        │   └── Toast.jsx                # Toast alerts
        │
        ├── customer/                    # CUSTOMER-FACING / PUBLIC FACING
        │   ├── CustomerPortal.jsx       # Public portal master container
        │   ├── HeroSection.jsx          # Countdown, prize pool, registration CTA
        │   ├── ChallengesSection.jsx    # Problem statement cards
        │   ├── PrizesSection.jsx        # Cash prize podium & bounties
        │   ├── ScheduleSection.jsx      # Daily event roadmap & timeline
        │   ├── SponsorsSection.jsx      # Partner brand exhibition
        │   ├── TeamsShowcaseSection.jsx # Public verified teams
        │   ├── FaqSection.jsx           # Collapsible FAQ accordion
        │   ├── ContactSection.jsx       # Contact form submitting to ContactUs model
        │   └── RegistrationModal.jsx    # Team registration modal
        │
        └── admin/                       # ADMIN PANEL (PRIVATE OPERATIONS)
            ├── AdminLayout.jsx          # Admin shell & sidebar navigation
            ├── AdminDashboard.jsx       # Executive KPI metrics & financial totals
            ├── SponsorshipManager.jsx   # Private funds ledger (Paid vs Pledged)
            ├── OrganizerTasksManager.jsx# Private operational task dispatch & Kanban
            ├── TeamRegistrationManager.jsx# Application approval review workflow
            ├── ParticipantPrivateManager.jsx# Confidential medical alerts & resume vault
            ├── CheckInStation.jsx       # Live desk check-in scanner
            ├── TableRoomManager.jsx     # Hall & workstation desk allocations
            ├── NotificationDispatcher.jsx# Broadcast alert dispatcher
            └── JsonExportCenter.jsx     # Master JSON Data Exporter`}
          </pre>
        </div>
      )}

      {/* TAB 3: NORMAL VS PRIVATE COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="glass-card p-8 rounded-3xl border-slate-800">
          <h3 className="text-xl font-bold text-white mb-6">
            Architectural Separation Rationale
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-cyan-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-2">
                Customer Facing (Public Surface)
              </span>
              <p className="leading-relaxed text-slate-300">
                Only exposes models necessary for participant engagement: hackathon details, prize allocations, problem statements, event schedules, sponsor branding, and FAQs. Confidential details (negotiated sponsorship sums, student medical allergies, CV files, or internal task deadlines) are strictly shielded.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/60 border border-amber-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                Admin Panel (Privileged Operations)
              </span>
              <p className="leading-relaxed text-slate-300">
                Encapsulates all sensitive operational models: financial sponsorship contracts (<code className="text-amber-300">paid</code>, <code className="text-amber-300">pledged</code>, notes), internal organizer committee tasks (<code className="text-amber-300">OrgTask</code>), participant medical records & dietary requests (<code className="text-amber-300">Participant</code>), physical table allocations, and on-site check-in logs.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
