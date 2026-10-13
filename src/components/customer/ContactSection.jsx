import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { MessageSquare, Send, Mail, MapPin, Phone } from 'lucide-react';

export default function ContactSection() {
  const { submitContactInquiry, hackathon } = useHackathon();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) return;
    submitContactInquiry(formData);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400 mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Connect with Organizers</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Have Inquiries? Reach Out
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Have questions regarding sponsorship, mentor volunteering, or campus travel logistics? Message our core committee directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* Contact Details Card */}
          <div className="lg:col-span-2 glass-card p-8 rounded-3xl border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                BIC Hackathon HQ
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-8">
                The organizing desk operates 24/7 during sprint days. For urgent inquiries, visit our information counter at Hall A foyer.
              </p>

              <div className="space-y-5 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold uppercase">Venue</span>
                    <span>{hackathon.venue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold uppercase">Email</span>
                    <span>operations@bichackathon.org</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-semibold uppercase">Helpline</span>
                    <span>+977-1-4458921</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
              BIC Backend Model: ContactUs (crm.py)
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3 glass-card p-8 rounded-3xl border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Thapa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@institute.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab equipment request / Mentor pass"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can the organizing committee assist you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Message to Committee</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
}
