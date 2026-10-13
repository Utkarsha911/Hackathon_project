import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Terminal, Code2, Globe, Share2, Shield, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { hackathon } = useHackathon();

  return (
    <footer className="border-t border-slate-800/80 bg-[#06080e] text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-white">
                {hackathon.title}
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
              {hackathon.sub_heading}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-[#0e131f] hover:text-white transition-colors" title="GitHub">
                <Code2 className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-[#0e131f] hover:text-white transition-colors" title="Twitter">
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a href="https://bichackathon.org" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-[#0e131f] hover:text-white transition-colors" title="Website">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3 font-mono">
              Event Navigation
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#tracks" className="hover:text-white transition-colors">Challenges</a></li>
              <li><a href="#prizes" className="hover:text-white transition-colors">Prizes</a></li>
              <li><a href="#schedule" className="hover:text-white transition-colors">Schedule</a></li>
              <li><a href="#squads" className="hover:text-white transition-colors">Squads Directory</a></li>
              <li><a href="#sponsors" className="hover:text-white transition-colors">Partners</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Operations & Admin Route */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3 font-mono">
              Staff & Operations
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/admin" 
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 font-medium transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Operations Panel</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block">
                  Restricted to committee staff, judge panels, and desk reception.
                </span>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact Committee Desk
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <div>
            © {hackathon.year} BIC InnovateX. Models mapped from <code className="text-slate-400">bic_hackathon_design</code>.
          </div>
          <div>
            Production Environment
          </div>
        </div>

      </div>
    </footer>
  );
}
