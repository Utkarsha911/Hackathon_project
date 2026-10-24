import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Keyboard,
  Check,
  User,
  Users,
  Award,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import jsQR from 'jsqr';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { playScanSuccessSound, decodeQrFromFile } from '../../utils/qrUtils';

/**
 * Enterprise QR Scanner Modal for recording events and checking in attendees.
 * Supports:
 * - Live webcam/phone camera video feed with real-time jsQR detection
 * - Image file drop/upload decoding
 * - Manual credential ID/token input fallback
 */
export default function QrScannerModal({ isOpen, onClose, onScanSuccess, title = 'Scan QR Badge', subtitle = 'Scan attendee credential pass to record event' }) {
  useBodyScrollLock(isOpen);

  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraError, setCameraError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const hasDetectedRef = useRef(false);

  // Helper to parse scanned raw text into structured attendee object
  const parseScannedData = (rawText) => {
    if (!rawText) return null;
    const text = String(rawText).trim();

    // 1. Try parsing JSON format
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        const type = (parsed.type || '').toLowerCase();
        return {
          raw: text,
          type: ['guest', 'organizer', 'participant'].includes(type) ? type : 'participant',
          id: parsed.id || parsed.bic_id || '',
          name: parsed.name || 'Attendee',
          email: parsed.email || '',
          role: parsed.role || '',
          team: parsed.team || parsed.team_name || '',
          organization: parsed.org || parsed.organization || '',
          hackathon_id: parsed.hackathon_id || parsed.hackathon || ''
        };
      }
    } catch {
      // Not JSON, continue to string patterns
    }

    // 2. Parse token string formats like #PART-0042, #ORG-0005, #GST-0001
    const tokenMatch = text.match(/#(PART|ORG|GST)[-_]?(\d+)/i);
    if (tokenMatch) {
      const prefix = tokenMatch[1].toUpperCase();
      const numId = Number(tokenMatch[2]);
      const type = prefix === 'GST' ? 'guest' : prefix === 'ORG' ? 'organizer' : 'participant';
      return {
        raw: text,
        type,
        id: numId,
        name: `${type.toUpperCase()} #${numId}`,
        email: ''
      };
    }

    // 3. Fallback: plain string / numeric ID
    const isNum = /^\d+$/.test(text);
    return {
      raw: text,
      type: 'participant',
      id: isNum ? Number(text) : text,
      name: `Attendee (${text})`,
      email: ''
    };
  };

  // Handle successful detection
  const handleSuccessfulScan = (rawText) => {
    if (hasDetectedRef.current) return;
    hasDetectedRef.current = true;

    playScanSuccessSound();
    const attendee = parseScannedData(rawText);
    setScannedResult(attendee);

    // Stop camera video stream
    stopCamera();

    // Auto trigger onScanSuccess or let user review
    if (onScanSuccess) {
      onScanSuccess(attendee);
    }
  };

  // Camera stream initialization
  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    setCameraLoading(true);
    hasDetectedRef.current = false;

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser.');
      }

      // Try back camera first, fallback to user camera
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraLoading(false);
        requestAnimationFrame(tickScan);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraLoading(false);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please enable camera in your browser settings or switch to Upload tab.'
          : 'Unable to start camera video feed. You can use image upload or manual input below.'
      );
    }
  };

  // Continuous frame analysis
  const tickScan = () => {
    if (!videoRef.current || hasDetectedRef.current) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleSuccessfulScan(code.data);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  // Stop camera tracks
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start or stop camera based on modal open state and active tab
  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !scannedResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, scannedResult]);

  // Handle file drop/upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadError('');

    try {
      const result = await decodeQrFromFile(file);
      if (result) {
        handleSuccessfulScan(result);
      } else {
        setUploadError('No QR code detected in the uploaded image. Please ensure the QR code is clearly visible.');
      }
    } catch (err) {
      setUploadError(err?.message || 'Failed to process image file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle manual code submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
  };

  // Reset scan state
  const handleResetScan = () => {
    setScannedResult(null);
    hasDetectedRef.current = false;
    setManualCode('');
    setUploadError('');
    if (activeMode === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!scannedResult && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('camera');
                  setCameraError('');
                }}
                className={`flex-1 py-1.5 rounded-lg inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Live Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveMode('upload');
                }}
                className={`flex-1 py-1.5 rounded-lg inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Upload Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveMode('manual');
                }}
                className={`flex-1 py-1.5 rounded-lg inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Manual Token</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6">
          {/* SUCCESS DETECTED STATE */}
          {scannedResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                  {scannedResult.type} Credential Verified
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-2">
                  {scannedResult.name}
                </h4>
                {scannedResult.email && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {scannedResult.email}
                  </p>
                )}
                {scannedResult.team && (
                  <p className="text-xs text-slate-600 mt-1">
                    Squad: <strong>{scannedResult.team}</strong>
                  </p>
                )}
                {scannedResult.organization && (
                  <p className="text-xs text-slate-600 mt-1">
                    Org: <strong>{scannedResult.organization}</strong>
                  </p>
                )}
                <div className="mt-2 text-[11px] font-mono text-slate-400">
                  ID: #{scannedResult.type?.substring(0, 3)?.toUpperCase()}-{String(scannedResult.id || '0000').padStart(4, '0')}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Scan Another
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  <span>Apply & Close</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : activeMode === 'camera' ? (
            /* 1. CAMERA LIVE SCANNER */
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-slate-200 shadow-inner">
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white z-10 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#ea580c]" />
                    <span className="text-xs font-medium">Initializing camera...</span>
                  </div>
                )}

                {cameraError ? (
                  <div className="p-6 text-center text-white space-y-2 z-10">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                      {cameraError}
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMode('upload')}
                        className="px-3 py-1.5 rounded-lg bg-[#ea580c] hover:opacity-90 text-xs font-semibold text-white transition"
                      >
                        Upload Image Instead
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Laser Scanner Frame Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-56 h-56 relative rounded-2xl border-2 border-dashed border-orange-400/70 shadow-lg">
                        {/* 4 Glowing Corner Brackets */}
                        <span className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-[#ea580c] rounded-tl-lg" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-[#ea580c] rounded-tr-lg" />
                        <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-[#ea580c] rounded-bl-lg" />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-[#ea580c] rounded-br-lg" />

                        {/* Scanner Laser Bar */}
                        <div className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#ea580c] to-transparent shadow-xs animate-bounce top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Point the camera at an official BIC Hackathon Attendee QR badge.
                </p>
              </div>
            </div>
          ) : activeMode === 'upload' ? (
            /* 2. FILE UPLOAD SCANNER */
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-200 hover:border-[#ea580c] hover:bg-orange-50/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#ea580c] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {isProcessingFile ? 'Decoding QR image...' : 'Choose QR Code Image'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload a photo, screenshot, or downloaded badge PNG/JPG to decode instantly.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessingFile}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          ) : (
            /* 3. MANUAL TOKEN INPUT */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attendee ID or Raw Check-in Token
                </label>
                <input
                  type="text"
                  placeholder="e.g. #PART-0042, #ORG-0005, or raw payload..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#ea580c]"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the participant ID number or paste clipboard JSON credential.
                </p>
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#ea580c' }}
              >
                Validate & Record
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
