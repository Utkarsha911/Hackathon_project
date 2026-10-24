import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  QrCode,
  Users,
  Award,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import { generateQrDataUrl } from '../../utils/qrUtils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

/**
 * Reusable enterprise QR Credential Badge Modal
 * Generates and displays a verifiable ID pass with QR code for:
 * - Participants
 * - Organizers
 * - Guests
 */
export default function QrBadgeModal({ isOpen, onClose, attendee }) {
  useBodyScrollLock(isOpen);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printAreaRef = useRef(null);

  // Generate QR code whenever attendee changes
  useEffect(() => {
    if (!isOpen || !attendee) {
      setQrDataUrl('');
      return;
    }

    setGenerating(true);

    // Verifiable credential payload
    const payload = {
      protocol: 'BIC-PASS-v1',
      type: attendee.type || 'attendee',
      id: attendee.id,
      name: attendee.name,
      email: attendee.email || '',
      role: attendee.role || (attendee.type === 'guest' ? 'Guest Speaker' : 'Participant'),
      team: attendee.team_name || attendee.team?.name || '',
      team_id: attendee.team_id || attendee.team?.id || '',
      org: attendee.organization || attendee.department || '',
      hackathon_id: attendee.hackathon_id || attendee.hackathon || '',
      issued_at: new Date().toISOString()
    };

    generateQrDataUrl(payload, {
      width: 400,
      margin: 2,
      darkColor: '#0f172a',
      lightColor: '#ffffff'
    })
      .then((url) => {
        setQrDataUrl(url || '');
      })
      .catch((err) => {
        console.error('Failed to generate QR badge data URL:', err);
      })
      .finally(() => {
        setGenerating(false);
      });
  }, [isOpen, attendee]);

  if (!isOpen || !attendee) return null;

  const type = (attendee.type || 'participant').toLowerCase();
  const isParticipant = type === 'participant';
  const isOrganizer = type === 'organizer';
  const isGuest = type === 'guest';

  // Role badge display config
  const roleBadgeConfig = isOrganizer
    ? {
        label: attendee.role || 'Organizer',
        bg: 'bg-orange-50',
        text: 'text-[#ea580c]',
        border: 'border-orange-200',
        Icon: Award
      }
    : isGuest
    ? {
        label: attendee.designation || 'Special Guest',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        Icon: ShieldCheck
      }
    : {
        label: attendee.role || 'Participant',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        Icon: Users
      };

  const RoleIcon = roleBadgeConfig.Icon;

  // Handle PNG download
  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const safeName = (attendee.name || 'attendee')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.download = `bic-${type}-qr-${safeName}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Copy raw payload
  const handleCopyPayload = () => {
    const payload = JSON.stringify({
      protocol: 'BIC-PASS-v1',
      type,
      id: attendee.id,
      name: attendee.name,
      email: attendee.email,
      team: attendee.team_name,
      hackathon_id: attendee.hackathon_id
    }, null, 2);

    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header bar with Close */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Credential Badge</h3>
              <p className="text-[11px] text-slate-500">Official event check-in pass</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Physical ID Card Preview Area */}
        <div className="p-6">
          <div
            ref={printAreaRef}
            className="rounded-2xl border-2 border-slate-200 bg-linear-to-b from-white to-slate-50/70 p-5 shadow-sm space-y-4 text-center relative overflow-hidden"
          >
            {/* Top Brand Accent Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: '#ea580c' }}
            />

            {/* Event Name Tag */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider pt-1">
              <span>BIC HACKATHON</span>
              <span>VERIFIED BADGE</span>
            </div>

            {/* Attendee Avatar & Title */}
            <div className="space-y-1.5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xl border-2 border-white shadow-xs">
                {attendee.avatar ? (
                  <img
                    src={attendee.avatar}
                    alt={attendee.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  (attendee.name || 'A')[0].toUpperCase()
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                {attendee.name}
              </h4>
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeConfig.bg} ${roleBadgeConfig.text} ${roleBadgeConfig.border}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleBadgeConfig.label}</span>
                </span>
                {attendee.team_name && (
                  <span className="text-[11px] font-medium text-slate-600 px-2 py-0.5 rounded-full bg-slate-100">
                    Team: {attendee.team_name}
                  </span>
                )}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto">
              {generating ? (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating secure QR...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Badge for ${attendee.name}`}
                  className="w-48 h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-rose-500 text-xs">
                  Failed to generate QR
                </div>
              )}
            </div>

            {/* ID Token & Organization Details */}
            <div className="space-y-1 text-xs">
              <div className="font-mono text-slate-500 font-semibold text-[11px]">
                ID: #{type.substring(0, 3).toUpperCase()}-{String(attendee.id || '0000').padStart(4, '0')}
              </div>
              {attendee.organization && (
                <div className="text-slate-600 flex items-center justify-center gap-1 text-[11px]">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{attendee.organization}</span>
                </div>
              )}
              {attendee.college_name && (
                <div className="text-slate-600 flex items-center justify-center gap-1 text-[11px]">
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  <span>{attendee.college_name}</span>
                </div>
              )}
              {attendee.email && (
                <div className="text-slate-400 font-mono text-[10px]">
                  {attendee.email}
                </div>
              )}
            </div>

            {/* Bottom Meta */}
            {(attendee.shirt_size || attendee.food_preference) && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] text-slate-500">
                {attendee.shirt_size && (
                  <span>T-Shirt: <strong>{attendee.shirt_size}</strong></span>
                )}
                {attendee.food_preference && (
                  <span className="capitalize">
                    Meal: <strong>{attendee.food_preference.replace('_', ' ')}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
          </div>

          {/* Copy Payload button */}
          <button
            type="button"
            onClick={handleCopyPayload}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Credential payload copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy Raw Check-in Payload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline QR Thumbnail component for cards & tables
 */
export function QrThumbnail({ attendee, size = 48, onClick }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!attendee) return;
    const payload = {
      type: attendee.type || 'attendee',
      id: attendee.id,
      name: attendee.name,
      team_id: attendee.team_id || attendee.team?.id || ''
    };
    generateQrDataUrl(payload, { width: 120, margin: 1 })
      .then((url) => setDataUrl(url || ''))
      .catch(() => {});
  }, [attendee]);

  return (
    <button
      type="button"
      onClick={onClick}
      title="View QR Credential Badge"
      className="p-1 rounded-xl bg-white border border-slate-200 hover:border-[#ea580c] hover:shadow-xs transition group cursor-pointer shrink-0"
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="QR"
          style={{ width: size, height: size }}
          className="rounded-lg object-contain group-hover:scale-105 transition-transform"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"
        >
          <QrCode className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}
