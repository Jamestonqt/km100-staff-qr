import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  Flashlight,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  LogOut,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  Search,
  Upload,
  RefreshCw,
} from 'lucide-react';
import type {
  Employee,
  GateStation,
  ScanLog,
  ScanType,
  VerificationStatus,
} from '../types/database';
import { GATE_STATIONS } from '../types/database';
import { portalService } from '../lib/supabase';
import { parseQRPayload, getInitials } from '../utils/qr';
import { soundManager } from '../utils/audio';

interface ScannerViewProps {
  onScanRecorded: () => void;
  recentLogs: ScanLog[];
}

interface VerificationResult {
  status: VerificationStatus;
  message: string;
  scanType: ScanType;
  gateLocation: string;
  timestamp: string;
  employee?: Employee | null;
  scannedCode: string;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScanRecorded, recentLogs }) => {
  // Gate Controls
  const [scanType, setScanType] = useState<ScanType>('CHECK_IN');
  const [gateLocation, setGateLocation] = useState<GateStation>('Main Campus Gate');

  // Camera State
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  // Manual & Verification State
  const [manualCode, setManualCode] = useState<string>('');
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Anti-passback / cooldown: map of code -> timestamp (ms)
  const cooldownRef = useRef<Map<string, number>>(new Map());
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const list = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id.substring(0, 5)}` }));
          setCameras(list);
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
          if (backCam) {
            setSelectedCameraId(backCam.id);
          }
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error (permissions may be requested upon start):', err);
      });

    return () => {
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().catch(console.error);
          }
          scannerInstanceRef.current.clear();
        } catch {
          // ignore
        }
        scannerInstanceRef.current = null;
      }
    };
  }, []);

  // Verification Logic
  const handleVerifyPayload = useCallback(
    async (rawCodeOrJson: string) => {
      if (isProcessingScanRef.current) return;
      isProcessingScanRef.current = true;
      setIsVerifying(true);

      const parsed = parseQRPayload(rawCodeOrJson);
      const codeToVerify = parsed.code || 'UNKNOWN';
      const now = Date.now();

      // Anti-Passback Cooldown Check (10 seconds)
      const lastScannedTime = cooldownRef.current.get(codeToVerify);
      if (lastScannedTime && now - lastScannedTime < 10000) {
        const remainingSec = Math.ceil((10000 - (now - lastScannedTime)) / 1000);
        soundManager.playWarningBeep();

        setLastResult({
          status: 'DUPLICATE_SCAN',
          message: `ANTI-PASSBACK COOLDOWN: Badge ${codeToVerify} was scanned ${10 - remainingSec}s ago. Please wait ${remainingSec}s.`,
          scanType,
          gateLocation,
          timestamp: new Date().toLocaleTimeString(),
          scannedCode: codeToVerify,
        });

        setTimeout(() => {
          isProcessingScanRef.current = false;
          setIsVerifying(false);
        }, 1200);
        return;
      }

      // Check format validity
      if (!parsed.validFormat) {
        soundManager.playDeniedBuzzer();

        await portalService.recordScanLog({
          employee_id: null,
          employee_code: codeToVerify,
          employee_name: 'Unknown / Unregistered',
          department: 'Unknown',
          scan_type: scanType,
          verification_status: 'INVALID_QR',
          gate_location: gateLocation,
        });

        setLastResult({
          status: 'INVALID_QR',
          message: parsed.error || 'INVALID BADGE: Not a KM100 verified access credential.',
          scanType,
          gateLocation,
          timestamp: new Date().toLocaleTimeString(),
          scannedCode: codeToVerify,
        });

        onScanRecorded();
        setTimeout(() => {
          isProcessingScanRef.current = false;
          setIsVerifying(false);
        }, 1500);
        return;
      }

      // Look up employee in database
      const employee = await portalService.findEmployeeByCode(codeToVerify);

      if (!employee) {
        soundManager.playDeniedBuzzer();

        await portalService.recordScanLog({
          employee_id: null,
          employee_code: codeToVerify,
          employee_name: 'Unknown / Unregistered',
          department: 'Unknown',
          scan_type: scanType,
          verification_status: 'INVALID_QR',
          gate_location: gateLocation,
        });

        setLastResult({
          status: 'INVALID_QR',
          message: `UNREGISTERED STAFF: Code ${codeToVerify} not found in KM100 records.`,
          scanType,
          gateLocation,
          timestamp: new Date().toLocaleTimeString(),
          scannedCode: codeToVerify,
        });

        onScanRecorded();
        setTimeout(() => {
          isProcessingScanRef.current = false;
          setIsVerifying(false);
        }, 1500);
        return;
      }

      // If token is present in payload, verify token matches
      if (parsed.token && parsed.token !== employee.qr_token) {
        soundManager.playDeniedBuzzer();

        await portalService.recordScanLog({
          employee_id: employee.id,
          employee_code: employee.employee_code,
          employee_name: employee.full_name,
          department: employee.department,
          scan_type: scanType,
          verification_status: 'INVALID_QR',
          gate_location: gateLocation,
        });

        setLastResult({
          status: 'INVALID_QR',
          message: 'SECURITY HASH MISMATCH: Badge token is invalid or revoked.',
          scanType,
          gateLocation,
          timestamp: new Date().toLocaleTimeString(),
          employee,
          scannedCode: employee.employee_code,
        });

        onScanRecorded();
        setTimeout(() => {
          isProcessingScanRef.current = false;
          setIsVerifying(false);
        }, 1500);
        return;
      }

      // Check Employee Status
      if (employee.status !== 'Active') {
        soundManager.playDeniedBuzzer();

        await portalService.recordScanLog({
          employee_id: employee.id,
          employee_code: employee.employee_code,
          employee_name: employee.full_name,
          department: employee.department,
          scan_type: scanType,
          verification_status: 'INACTIVE_STAFF',
          gate_location: gateLocation,
        });

        setLastResult({
          status: 'INACTIVE_STAFF',
          message: `ACCESS DENIED: Staff account status is "${employee.status.toUpperCase()}". Access blocked.`,
          scanType,
          gateLocation,
          timestamp: new Date().toLocaleTimeString(),
          employee,
          scannedCode: employee.employee_code,
        });

        onScanRecorded();
        setTimeout(() => {
          isProcessingScanRef.current = false;
          setIsVerifying(false);
        }, 1500);
        return;
      }

      // VALID SCAN!
      cooldownRef.current.set(employee.employee_code, now);
      soundManager.playSuccessChime();

      if (scanType === 'CHECK_IN') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#14b8a6', '#06b6d4'],
        });
      }

      await portalService.recordScanLog({
        employee_id: employee.id,
        employee_code: employee.employee_code,
        employee_name: employee.full_name,
        department: employee.department,
        scan_type: scanType,
        verification_status: 'VALID',
        gate_location: gateLocation,
      });

      setLastResult({
        status: 'VALID',
        message: `ACCESS GRANTED: ${employee.full_name} (${scanType.replace('_', ' ')})`,
        scanType,
        gateLocation,
        timestamp: new Date().toLocaleTimeString(),
        employee,
        scannedCode: employee.employee_code,
      });

      onScanRecorded();
      setTimeout(() => {
        isProcessingScanRef.current = false;
        setIsVerifying(false);
      }, 1500);
    },
    [gateLocation, onScanRecorded, scanType]
  );

  // Safely stop scanner
  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        scannerInstanceRef.current.clear();
      } catch (err) {
        console.warn('Error while stopping scanner:', err);
      }
      scannerInstanceRef.current = null;
    }
    setIsScanning(false);
    setHasTorch(false);
    setTorchOn(false);
  };

  // Start Scanner with robust fallbacks
  const startScanner = async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    // Stop any existing instance first
    await stopScanner();

    // Check secure context
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext === false &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
    ) {
      setCameraError(
        'Camera access requires a secure connection (HTTPS or localhost). If opening on mobile via local network IP, browsers block live camera video streams. Please use the "Upload / Snap Photo" button below or manual code entry.'
      );
      setIsStartingCamera(false);
      return;
    }

    try {
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerInstanceRef.current = scanner;

      // Responsive qrbox calculation to prevent OverconstrainedError on small screens
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edge = Math.max(Math.floor(minEdge * 0.72), 160);
        return { width: edge, height: edge };
      };

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: qrboxFunction,
      };

      // Multi-tier camera initialization:
      // 1. Chosen camera ID or rear camera (facingMode: environment)
      // 2. Front camera (facingMode: user)
      // 3. Fallback to any enumerated video camera
      const tryStart = async (cameraConfig: string | MediaTrackConstraints) => {
        await scanner.start(
          cameraConfig,
          config,
          (decodedText) => {
            handleVerifyPayload(decodedText);
          },
          () => {
            // Frame scanned without QR code - ignore
          }
        );
      };

      try {
        if (selectedCameraId) {
          await tryStart(selectedCameraId);
        } else {
          await tryStart({ facingMode: 'environment' });
        }
      } catch (primaryErr) {
        console.warn('Primary camera start failed, attempting user-facing fallback...', primaryErr);
        try {
          await tryStart({ facingMode: 'user' });
        } catch (secondaryErr) {
          console.warn('Secondary camera start failed, attempting first available device...', secondaryErr);
          if (cameras.length > 0) {
            await tryStart(cameras[0].id);
          } else {
            throw secondaryErr;
          }
        }
      }

      setIsScanning(true);

      // Check flashlight/torch capability
      try {
        const track = scanner.getRunningTrackCapabilities();
        if (track && 'torch' in track) {
          setHasTorch(true);
        }
      } catch {
        // Torch capability not supported on this browser/camera
      }

      // Re-query camera devices now that permissions have been granted
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const list = devices.map((d) => ({
            id: d.id,
            label: d.label || `Camera ${d.id.substring(0, 5)}`,
          }));
          setCameras(list);
        }
      } catch {
        // Ignore
      }
    } catch (err: unknown) {
      console.error('Camera start failed:', err);
      let errorMsg = 'Unable to access camera on this device.';
      const errStr = String(err);
      const errName = err instanceof Error ? err.name : '';

      if (errName === 'NotAllowedError' || errStr.includes('Permission') || errStr.includes('NotAllowed')) {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings (look for the camera/lock icon in your address bar).';
      } else if (errName === 'NotFoundError' || errStr.includes('NotFound') || errStr.includes('DevicesNotFoundError')) {
        errorMsg = 'No camera device found. Please ensure your webcam is plugged in or use manual entry.';
      } else if (errName === 'NotReadableError' || errStr.includes('NotReadable') || errStr.includes('TrackStartError')) {
        errorMsg = 'Camera is currently in use by another application (e.g. Zoom, Teams, or another browser tab). Please close other apps and retry.';
      } else if (errName === 'OverconstrainedError' || errStr.includes('Overconstrained')) {
        errorMsg = 'Camera format not supported by this device. Try selecting a different camera from the dropdown.';
      } else if (err instanceof Error && err.message) {
        errorMsg = `Camera error: ${err.message}`;
      }

      setCameraError(errorMsg);
      await stopScanner();
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (isScanning || isStartingCamera) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  // Scan file / photo fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsVerifying(true);
      setCameraError(null);

      // Create a temporary scanner instance if one is not running
      let scanner = scannerInstanceRef.current;
      let shouldClean = false;
      if (!scanner) {
        scanner = new Html5Qrcode('qr-reader-container');
        shouldClean = true;
      }

      const decodedText = await scanner.scanFile(file, true);
      handleVerifyPayload(decodedText);

      if (shouldClean) {
        scanner.clear();
      }
    } catch (err) {
      console.warn('File QR scan failed:', err);
      soundManager.playDeniedBuzzer();
      setLastResult({
        status: 'INVALID_QR',
        message: 'No valid KM100 QR code detected in the uploaded image. Please ensure the QR is clear and well-lit.',
        scanType,
        gateLocation,
        timestamp: new Date().toLocaleTimeString(),
        scannedCode: 'FILE_UPLOAD',
      });
    } finally {
      setIsVerifying(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleTorch = async () => {
    if (!scannerInstanceRef.current || !hasTorch) return;
    try {
      const advancedConstraint = {} as Record<string, boolean>;
      advancedConstraint.torch = !torchOn;
      await scannerInstanceRef.current.applyVideoConstraints({
        advanced: [advancedConstraint as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyPayload(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Gate Controls */}
      <div className="bg-[#16191e] border border-[#222730] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Check-In / Check-Out Segmented Switch */}
        <div className="flex items-center w-full md:w-auto bg-[#0d0f12] p-1.5 rounded-xl border border-[#222730]">
          <button
            onClick={() => setScanType('CHECK_IN')}
            aria-label="Set gate mode to CHECK-IN"
            className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
              scanType === 'CHECK_IN'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>CAMPUS ENTRY</span>
          </button>

          <button
            onClick={() => setScanType('CHECK_OUT')}
            aria-label="Set gate mode to CHECK-OUT"
            className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              scanType === 'CHECK_OUT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>CAMPUS EXIT</span>
          </button>
        </div>

        {/* Gate Station & Camera Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Gate Station Dropdown */}
          <div className="flex items-center space-x-2 bg-[#0d0f12] px-3.5 py-2.5 rounded-xl border border-[#222730]">
            <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
            <select
              value={gateLocation}
              onChange={(e) => setGateLocation(e.target.value as GateStation)}
              aria-label="Select Gate Station"
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {GATE_STATIONS.map((station) => (
                <option key={station} value={station} className="bg-[#16191e] text-white">
                  {station}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Device Dropdown (if multiple) */}
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              disabled={isScanning}
              aria-label="Select Video Camera"
              className="bg-[#0d0f12] px-3.5 py-2.5 rounded-xl border border-[#222730] text-xs font-bold text-slate-300 focus:outline-none disabled:opacity-50"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#16191e] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          )}

          {/* Hidden File Input for Image / Camera Photo capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
            id="badge-photo-upload"
          />

          {/* Upload / Snap Photo Action */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload QR image or snap photo"
            className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-[#222730] hover:bg-[#2c3340] text-slate-200 border border-[#323946] text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Snap / Upload Photo</span>
          </button>

          {/* Start/Stop Camera Button */}
          <button
            onClick={toggleCamera}
            disabled={isStartingCamera}
            aria-label={isScanning ? 'Stop optical camera scanner' : 'Start optical camera scanner'}
            className={`min-h-[44px] flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer ${
              isScanning
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
            }`}
          >
            {isStartingCamera ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Starting...</span>
              </>
            ) : isScanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Stop Scanner</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Start Scanner</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Live Scanner & Verification Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Camera Viewfinder + Manual Entry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#16191e] border border-[#222730] rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isScanning ? 'bg-orange-500 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Optical Scanner • {gateLocation}
                </h3>
              </div>

              {hasTorch && isScanning && (
                <button
                  onClick={toggleTorch}
                  aria-label={torchOn ? 'Turn off camera flashlight' : 'Turn on camera flashlight'}
                  className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 ${
                    torchOn
                      ? 'bg-orange-500 border-orange-400 text-slate-950 font-bold'
                      : 'bg-[#222730] border-[#323946] text-slate-300'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                </button>
              )}
            </div>

            {/* Video Feed Box with Industrial Reticle */}
            <div className="relative w-full aspect-square max-h-[380px] bg-[#0d0f12] rounded-xl overflow-hidden border border-[#222730] flex items-center justify-center">
              {/* html5-qrcode target div - ALWAYS present and sized in DOM */}
              <div
                id="qr-reader-container"
                className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />

              {/* Industrial Viewfinder Corner Reticle Guides */}
              {isScanning && (
                <div className="pointer-events-none absolute inset-8 border border-white/20 flex flex-col justify-between z-10">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-orange-500" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-orange-500" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-orange-500" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-orange-500" />
                  </div>
                </div>
              )}

              {/* Standby Idle State Overlay (renders when not scanning) */}
              {!isScanning && !cameraError && (
                <div className="absolute inset-0 z-10 bg-[#0d0f12] flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#12151a] border border-[#222730] flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Scanner Standby</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Click "Start Scanner" to open live video, snap a photo, or enter badge code below.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={startScanner}
                      disabled={isStartingCamera}
                      aria-label="Activate camera scanner"
                      className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      {isStartingCamera ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Starting Camera...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          <span>Start Live Camera</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2.5 rounded-xl bg-[#222730] hover:bg-[#2c3340] text-xs font-bold text-slate-300 border border-[#323946] transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>Snap / Upload Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Error Message Overlay */}
              {cameraError && (
                <div className="absolute inset-0 z-20 bg-[#0d0f12]/95 flex flex-col items-center justify-center p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-rose-500 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    Camera Access Alert
                  </h4>
                  <p className="text-xs text-rose-300 font-medium mb-4 max-w-sm leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={startScanner}
                      disabled={isStartingCamera}
                      className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs text-white font-bold cursor-pointer"
                    >
                      Retry Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg bg-[#222730] hover:bg-[#2c3340] text-xs text-slate-200 border border-[#323946] font-bold cursor-pointer flex items-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>Upload or Snap Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Code Input Bar */}
            <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Badge Code (e.g., KM100-001)..."
                  aria-label="Manual employee code input"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0d0f12] border border-[#222730] rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                aria-label="Verify entered badge code"
                className="min-h-[42px] px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                Verify
              </button>
            </form>

            {/* Quick Test Simulation Row */}
            <div className="mt-3.5 pt-3 border-t border-[#222730]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Simulate Scans (For Testing)
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleVerifyPayload('KM100-001')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#20252e] hover:bg-[#2b3240] border border-[#2f3745] text-orange-300 text-[11px] font-semibold transition-colors"
                >
                  ✓ Elena (Instructor)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayload('KM100-003')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#20252e] hover:bg-[#2b3240] border border-[#2f3745] text-orange-300 text-[11px] font-semibold transition-colors"
                >
                  ✓ Aria (Safety Officer)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayload('KM100-004')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors"
                >
                  ⚠ David (On Leave)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayload('KM100-005')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-semibold transition-colors"
                >
                  ✕ Sarah (Inactive)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayload('{"org":"ROGUE","code":"FAKE-999"}')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-semibold transition-colors"
                >
                  ✕ Unregistered Badge
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Verification Result Card & Recent Activity */}
        <div className="lg:col-span-5 space-y-4">
          {/* High-Visibility Verification Result Card */}
          <div
            className={`border rounded-2xl p-5 shadow-xl transition-all ${
              !lastResult
                ? 'bg-[#16191e] border-[#222730]'
                : lastResult.status === 'VALID'
                ? 'bg-[#16191e] border-emerald-500/80 shadow-emerald-950/30'
                : lastResult.status === 'DUPLICATE_SCAN'
                ? 'bg-[#16191e] border-amber-500/80 shadow-amber-950/30'
                : 'bg-[#16191e] border-rose-500/80 shadow-rose-950/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222730]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gate Verification Status
              </span>
              {lastResult && (
                <span className="text-[10px] font-mono text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-orange-400" />
                  {lastResult.timestamp}
                </span>
              )}
            </div>

            {lastResult ? (
              <div className="mt-4 space-y-4">
                {/* Result Status Banner */}
                <div
                  className={`p-4 rounded-xl flex items-center space-x-3 ${
                    lastResult.status === 'VALID'
                      ? 'bg-emerald-600 text-white'
                      : lastResult.status === 'DUPLICATE_SCAN'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {lastResult.status === 'VALID' ? (
                    <ShieldCheck className="w-8 h-8 shrink-0 text-white" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 shrink-0 text-white" />
                  )}
                  <div>
                    <h2 className="text-base font-black tracking-wide leading-tight uppercase">
                      {lastResult.status === 'VALID'
                        ? 'ACCESS GRANTED'
                        : lastResult.status === 'DUPLICATE_SCAN'
                        ? 'COOLDOWN ALERT'
                        : 'ACCESS DENIED'}
                    </h2>
                    <p className="text-xs font-semibold opacity-95 leading-tight mt-0.5">
                      {lastResult.message}
                    </p>
                  </div>
                </div>

                {/* Scanned Employee Profile details */}
                {lastResult.employee ? (
                  <div className="bg-[#0d0f12] rounded-xl p-4 border border-[#222730] flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-orange-500 bg-[#16191e]">
                      {lastResult.employee.photo_url ? (
                        <img
                          src={lastResult.employee.photo_url}
                          alt={lastResult.employee.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-orange-400">
                          {getInitials(lastResult.employee.full_name)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white truncate">
                          {lastResult.employee.full_name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-950/60 text-orange-300 border border-orange-500/30">
                          {lastResult.employee.employee_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold truncate mt-0.5">
                        {lastResult.employee.role}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#16191e] border border-[#222730] text-slate-300">
                          {lastResult.employee.department}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#16191e] border border-[#222730] text-slate-400">
                          {lastResult.gateLocation}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#0d0f12] rounded-xl border border-[#222730] text-xs text-slate-400 font-mono">
                    Scanned Badge: <span className="text-white font-bold">{lastResult.scannedCode}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">Gate scanner is ready.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Scan badge QR code via camera or manual search.
                </p>
              </div>
            )}
          </div>

          {/* Recent Gate Activity Log */}
          <div className="bg-[#16191e] border border-[#222730] rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#222730]">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Recent Campus Activity
              </h4>
              <span className="text-[10px] font-bold text-orange-400">Live Feed</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {recentLogs.slice(0, 5).map((log) => {
                const isValid = log.verification_status === 'VALID';
                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-[#0d0f12] border border-[#222730] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isValid ? 'bg-emerald-400' : 'bg-rose-500'
                        }`}
                      />
                      <div className="truncate">
                        <div className="font-bold text-white truncate">
                          {log.employee_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.employee_code} • {log.gate_location}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          log.scan_type === 'CHECK_IN'
                            ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30'
                            : 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {log.scan_type === 'CHECK_IN' ? 'Entry' : 'Exit'}
                      </span>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {new Date(log.scanned_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {recentLogs.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-600">No gate activity recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
