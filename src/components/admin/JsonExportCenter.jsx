import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { BACKEND_MODELS, MODEL_VISIBILITY } from '../../models/modelRegistry';
import { 
  downloadJsonFile, 
  copyJsonToClipboard, 
  bundleDatasetsByScope,
  createModelExportPackage 
} from '../../services/jsonExportService';
import { 
  FileJson, 
  Copy, 
  Download, 
  Shield, 
  Globe, 
  Check, 
  Database,
  Layers,
  Code2
} from 'lucide-react';

export default function JsonExportCenter() {
  const { allDataStore, showToast } = useHackathon();

  const [selectedModel, setSelectedModel] = useState('Hackathon');
  const [filterVisibility, setFilterVisibility] = useState('all'); // 'all' | 'normal' | 'private'
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'schema'

  const currentMeta = BACKEND_MODELS[selectedModel] || {
    name: selectedModel,
    tableName: selectedModel.toLowerCase(),
    visibility: 'normal',
    description: 'Data model'
  };

  const currentData = allDataStore[selectedModel] || [];
  const exportPackage = createModelExportPackage(selectedModel, currentData);
  const formattedJsonString = JSON.stringify(exportPackage, null, 2);

  const modelList = Object.keys(BACKEND_MODELS).filter((modelKey) => {
    if (filterVisibility === 'all') return true;
    return BACKEND_MODELS[modelKey].visibility === filterVisibility;
  });

  const handleCopy = async () => {
    const success = await copyJsonToClipboard(exportPackage);
    if (success) {
      setCopied(true);
      showToast(`Copied ${selectedModel}.json to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSingle = () => {
    const filename = `${currentMeta.tableName}_export.json`;
    downloadJsonFile(filename, exportPackage);
    showToast(`Downloaded ${filename} successfully!`);
  };

  const handleDownloadBundle = (scope) => {
    const bundle = bundleDatasetsByScope(allDataStore, scope);
    const filename = `bic_hackathon_${scope}_models_bundle.json`;
    downloadJsonFile(filename, bundle);
    showToast(`Downloaded ${filename} successfully!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-indigo-400 border border-slate-800 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>JSON Data Engine & Model Serializer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Backend Data Export Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Export and inspect JSON datasets mirroring models in <code className="text-slate-300">bic_hackathon_design</code>.
          </p>
        </div>

        {/* Global Batch Download Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadBundle('normal')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Download public customer-facing models"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Public Bundle (JSON)</span>
          </button>

          <button
            onClick={() => handleDownloadBundle('private')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            title="Download private admin-only models"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Private Bundle (JSON)</span>
          </button>

          <button
            onClick={() => handleDownloadBundle('all')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
            title="Full database backup snapshot"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Full DB Snapshot</span>
          </button>
        </div>
      </div>

      {/* Visibility Scope Filter Pills */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 font-mono">Filter:</span>
        <button
          onClick={() => setFilterVisibility('all')}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            filterVisibility === 'all'
              ? 'bg-slate-800 text-white'
              : 'bg-[#0e131f] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All 22 Models
        </button>

        <button
          onClick={() => setFilterVisibility('normal')}
          className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            filterVisibility === 'normal'
              ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/60'
              : 'bg-[#0e131f] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Globe className="w-3 h-3 text-sky-400" />
          <span>Customer Facing (Normal)</span>
        </button>

        <button
          onClick={() => setFilterVisibility('private')}
          className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            filterVisibility === 'private'
              ? 'bg-amber-950/60 text-amber-200 border border-amber-800/60'
              : 'bg-[#0e131f] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Shield className="w-3 h-3 text-amber-400" />
          <span>Admin Panel (Private)</span>
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Models Selector Grid */}
        <div className="lg:col-span-4 p-3 rounded-2xl bg-[#0e131f] border border-slate-800 space-y-1 max-h-[620px] overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800/80 mb-2 flex justify-between">
            <span>Model Catalog</span>
            <span>{modelList.length}</span>
          </div>

          {modelList.map((modelKey) => {
            const meta = BACKEND_MODELS[modelKey];
            const isSelected = selectedModel === modelKey;
            const isPrivate = meta.visibility === MODEL_VISIBILITY.PRIVATE;
            const count = Array.isArray(allDataStore[modelKey]) ? allDataStore[modelKey].length : 1;

            return (
              <button
                key={modelKey}
                onClick={() => setSelectedModel(modelKey)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span>{meta.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      isPrivate
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {isPrivate ? 'Private' : 'Normal'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono block mt-0.5 ${
                    isSelected ? 'text-indigo-200' : 'text-slate-500'
                  }`}>
                    {meta.tableName} ({count})
                  </span>
                </div>

                <FileJson className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Column: Code Viewer & Actions */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0e131f] border border-slate-800 overflow-hidden flex flex-col justify-between">
          
          {/* Top Panel for Selected Model */}
          <div className="p-4 border-b border-slate-800 bg-[#0a0e17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">
                  {currentMeta.name}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  currentMeta.visibility === MODEL_VISIBILITY.PRIVATE
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                    : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60'
                }`}>
                  {currentMeta.visibility.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  table: {currentMeta.tableName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentMeta.description}
              </p>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1.5 transition-colors"
                title="Copy formatted JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadSingle}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
                title="Download this JSON file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .json</span>
              </button>
            </div>
          </div>

          {/* JSON View Tab Switcher */}
          <div className="px-4 py-2 border-b border-slate-800 bg-[#080b11] flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => setActiveTab('json')}
              className={`pb-1 border-b-2 font-medium transition-colors ${
                activeTab === 'json'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Export Data (JSON)
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`pb-1 border-b-2 font-medium transition-colors ${
                activeTab === 'schema'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              SQLAlchemy Schema Fields
            </button>
          </div>

          {/* Body Viewer */}
          <div className="bg-[#06080e] p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px] overflow-y-auto">
            {activeTab === 'json' ? (
              <pre className="text-slate-300">
                <code>{formattedJsonString}</code>
              </pre>
            ) : (
              <div className="space-y-3">
                <div className="text-slate-400 text-xs font-sans pb-2 border-b border-slate-800">
                  Model defined in backend: <code className="text-indigo-400">{currentMeta.sourceFile}</code>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="py-2">Field Name</th>
                      <th className="py-2">SQLAlchemy Type</th>
                      <th className="py-2">Constraints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {currentMeta.fields?.map((f) => (
                      <tr key={f.name}>
                        <td className="py-2 font-bold text-white">{f.name}</td>
                        <td className="py-2 font-mono text-indigo-300">{f.type}</td>
                        <td className="py-2 text-slate-500">
                          {f.primaryKey ? 'PK' : f.required ? 'Nullable=False' : f.unique ? 'Unique' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Schema Footer Bar */}
          <div className="p-3 bg-[#0a0e17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Source: bic_hackathon_design/{currentMeta.sourceFile}</span>
            <span>Total records: {Array.isArray(currentData) ? currentData.length : 1}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
