import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { MessageSquare, Send, Mail, MapPin, Phone, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactSection() {
  const { submitContactInquiry, hackathon } = useHackathon();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'success' | 'throttled' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    try {
      await submitContactInquiry(formData);
      setSubmitStatus('success');
      setStatusMessage('Your inquiry has been successfully transmitted to the organizing committee. We will reach out to you via your email address soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      if (err?.isThrottled) {
        setSubmitStatus('throttled');
        setStatusMessage(err.message);
      } else {
        setSubmitStatus('error');
        setStatusMessage(err?.message || 'Failed to transmit message. Please try again or reach out to operations@bichackathon.org.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-coral-50 border border-coral-200 text-xs font-semibold text-coral-700 mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-coral-600" />
            <span>Connect with Organizers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Have Inquiries? Reach Out
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Questions about sponsorship, mentor volunteering, or campus travel logistics?
            Message our core committee directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact Details */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 p-8 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">BIC Hackathon HQ</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                The organizing desk operates 24/7 during sprint days. For urgent inquiries,
                visit our information counter at Hall A foyer.
              </p>

              <div className="space-y-5 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">Venue</span>
                    <span className="text-slate-900 font-medium">{hackathon?.venue || 'BIC Innovation Hub, Kathmandu'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">Email</span>
                    <span className="text-slate-900 font-medium">operations@bichackathon.org</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">Helpline</span>
                    <span className="text-slate-900 font-medium">+977-1-4458921</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Response time: Usually within 24 hours</span>
              <span className="font-mono text-[11px] text-slate-400">BIC CRM Desk</span>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3 bg-white border border-slate-200/90 p-8 rounded-2xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Throttled Notice */}
              {submitStatus === 'throttled' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">Daily Inquiry Limit Reached</p>
                    <p className="leading-relaxed text-amber-800">{statusMessage}</p>
                    <p className="text-xs text-amber-700 pt-1">
                      Need urgent assistance? Reach our desk directly at{' '}
                      <a href="mailto:operations@bichackathon.org" className="underline font-semibold text-amber-900 hover:text-amber-950">
                        operations@bichackathon.org
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {/* Success Notice */}
              {submitStatus === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-950">Message Transmitted Successfully</p>
                    <p className="leading-relaxed text-emerald-800">{statusMessage}</p>
                  </div>
                </div>
              )}

              {/* Generic Error Notice */}
              {submitStatus === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-950">Submission Failed</p>
                    <p className="leading-relaxed text-rose-800">{statusMessage}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Thapa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bic-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@institute.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bic-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Subject Line <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab equipment request / Mentor pass"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bic-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can the organizing committee assist you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bic-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || submitStatus === 'throttled'}
                className={`btn-primary w-full py-3.5 justify-center gap-2 text-sm font-bold ${
                  submitStatus === 'throttled' ? 'opacity-60 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Inquiry...</span>
                  </>
                ) : submitStatus === 'throttled' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Daily Limit Reached</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Transmit Message to Committee</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
