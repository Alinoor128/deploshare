'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ShareResultModal } from '@/components/sharing/ShareResultModal';
import { createShareAction } from '@/lib/actions/share-actions';
import { formatBytes } from '@/lib/security/sanitizer';
import { bundleFilesToZip } from '@/lib/utils/zip';
import { encryptBuffer, encryptText } from '@/lib/crypto/e2ee';
import { playUploadSuccessSound } from '@/lib/audio/sound-effects';
import {
  UploadCloud,
  FileText,
  File as FileIcon,
  X,
  Lock,
  Clock,
  Flame,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Trash2,
  FolderArchive,
  FolderPlus,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

interface WebkitEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file: (callback: (file: File) => void) => void;
  createReader: () => {
    readEntries: (callback: (entries: WebkitEntry[]) => void) => void;
  };
}

export function ShareCreator() {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');

  // Multi-File & Folder state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Text state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  // Security & E2EE state
  const [enableE2ee, setEnableE2ee] = useState(false);
  const [e2eeKeyPhrase, setE2eeKeyPhrase] = useState('');

  // Common Settings
  const [expiryOption, setExpiryOption] = useState('86400'); // 24 hours default
  const [customExpiryValue, setCustomExpiryValue] = useState('2');
  const [customExpiryUnit, setCustomExpiryUnit] = useState<'hours' | 'days'>('hours');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maxDownloadsOption, setMaxDownloadsOption] = useState<'unlimited' | '1' | '5' | '10' | '25' | 'custom'>('unlimited');
  const [customMaxDownloads, setCustomMaxDownloads] = useState('50');
  const [burnAfterDownload, setBurnAfterDownload] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Preparing payload...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    shareCode: string;
    shareId: string;
    expiresAt: string;
  } | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    try {
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const collectedFiles: File[] = [];

        // Helper to recursively traverse directories
        const readEntry = async (entry: WebkitEntry, currentPath = ''): Promise<void> => {
          if (entry.isFile) {
            await new Promise<void>((resolve) => {
              entry.file((file: File) => {
                if (currentPath) {
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: `${currentPath}${file.name}`,
                    writable: false,
                  });
                }
                collectedFiles.push(file);
                resolve();
              });
            });
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries: WebkitEntry[] = await new Promise((resolve) => {
              reader.readEntries((res: WebkitEntry[]) => resolve(res));
            });
            for (const child of entries) {
              await readEntry(child, `${currentPath}${entry.name}/`);
            }
          }
        };

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemWithEntry = item as unknown as { webkitGetAsEntry?: () => WebkitEntry | null };
          const entry = itemWithEntry.webkitGetAsEntry ? itemWithEntry.webkitGetAsEntry() : null;
          if (entry) {
            await readEntry(entry);
          } else {
            const file = item.getAsFile();
            if (file) collectedFiles.push(file);
          }
        }

        if (collectedFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...collectedFiles]);
          setErrorMessage(null);
          return;
        }
      }
    } catch {
      // Fallback to standard files array
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedList = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedList]);
      setErrorMessage(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const chosen = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...chosen]);
      setErrorMessage(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleResetForm = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTextTitle('');
    setTextContent('');
    setPassword('');
    setShowPassword(false);
    setEnablePassword(false);
    setEnableE2ee(false);
    setE2eeKeyPhrase('');
    setBurnAfterDownload(false);
    setResultData(null);
    setErrorMessage(null);
  };

  // Expiry calculation in seconds
  const calculateFinalExpirySeconds = (): number => {
    if (expiryOption === 'custom') {
      const val = parseInt(customExpiryValue, 10) || 1;
      return customExpiryUnit === 'days' ? val * 86400 : val * 3600;
    }
    return parseInt(expiryOption, 10);
  };

  const totalFilesSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === 'file' && selectedFiles.length === 0) {
      setErrorMessage('Please select or drop at least one file to share.');
      return;
    }

    if (activeTab === 'text' && !textContent.trim()) {
      setErrorMessage('Please enter text content to share.');
      return;
    }

    if (enablePassword && !password.trim()) {
      setErrorMessage('Please enter a password or disable password protection.');
      return;
    }

    if (enableE2ee && !e2eeKeyPhrase.trim() && !password.trim()) {
      setErrorMessage('Please enter an E2EE encryption key phrase or password.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);
    setProgressStatus('Packaging payload...');

    try {
      let finalFileToUpload: File | null = null;
      let finalContentToSend = textContent;

      const e2eeKey = (e2eeKeyPhrase.trim() || password.trim());

      // Handle multi-file bundling
      if (activeTab === 'file') {
        if (selectedFiles.length > 1) {
          setProgressStatus(`Compressing ${selectedFiles.length} files into ZIP...`);
          finalFileToUpload = await bundleFilesToZip(selectedFiles, undefined, (pct) => {
            setUploadProgress(10 + Math.round(pct * 0.3));
          });
        } else {
          finalFileToUpload = selectedFiles[0];
        }

        // Apply Client-Side E2EE if enabled
        if (enableE2ee && finalFileToUpload) {
          setProgressStatus('Performing Zero-Knowledge AES-GCM 256-bit encryption...');
          const fileBuf = await finalFileToUpload.arrayBuffer();
          const encryptedBuf = await encryptBuffer(fileBuf, e2eeKey);
          finalFileToUpload = new File([encryptedBuf], `${finalFileToUpload.name}.dps_enc`, {
            type: 'application/octet-stream',
          });
        }
      } else {
        // Text share E2EE
        if (enableE2ee && finalContentToSend) {
          setProgressStatus('Encrypting text client-side...');
          finalContentToSend = `[DPS_E2EE_V1_PAYLOAD]:${await encryptText(finalContentToSend, e2eeKey)}`;
        }
      }

      setUploadProgress(50);
      setProgressStatus('Generating 6-digit PIN & transmitting...');

      const formData = new FormData();
      formData.append('type', activeTab);
      formData.append('expirySeconds', calculateFinalExpirySeconds().toString());

      if (enablePassword && password.trim()) {
        formData.append('password', password.trim());
      }

      if (burnAfterDownload) {
        formData.append('burnAfterDownload', 'true');
      }

      formData.append('allowDownload', allowDownload ? 'true' : 'false');

      if (maxDownloadsOption === 'custom') {
        formData.append('maxDownloads', customMaxDownloads);
      } else {
        formData.append('maxDownloads', maxDownloadsOption);
      }

      if (activeTab === 'file' && finalFileToUpload) {
        formData.append('file', finalFileToUpload);
        formData.append('title', finalFileToUpload.name);
      } else {
        formData.append('textContent', finalContentToSend);
        if (textTitle.trim()) {
          formData.append('title', textTitle.trim());
        }
      }

      const result = await createShareAction(formData);
      setUploadProgress(100);

      if (!result.success || !result.data) {
        setErrorMessage(result.error || 'Failed to create share.');
        setIsSubmitting(false);
        setUploadProgress(0);
        return;
      }

      // Play success chime audio
      playUploadSuccessSound();

      setResultData(result.data);
      setResultModalOpen(true);
      setIsSubmitting(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Text metrics
  const textCharCount = textContent.length;
  const textWordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="info" size="md">
          <KeyRound className="w-3.5 h-3.5" />
          Code-Only Ephemeral Sharing
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Create a New Share
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Upload single/multiple files or paste text to generate a secure, temporary 6-digit numeric code.
        </p>
      </div>

      <Card glow className="p-6 sm:p-8 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Tab Selection */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('file');
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Share Files / Folder
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('text');
                setErrorMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Share Text / Code
            </button>
          </div>

          {/* TAB 1: FILE / MULTI-FILE / FOLDER UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />

              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-expect-error webkitdirectory is standard for folder picking
                webkitdirectory=""
                directory=""
                onChange={handleFileChange}
                className="hidden"
                id="folder-upload-input"
              />

              {selectedFiles.length === 0 ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 mb-4 shadow-sm">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Drop your files here
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 max-w-md">
                    or choose a file from your device (folders & large media supported)
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<UploadCloud className="w-4 h-4" />}
                    >
                      Choose File
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => folderInputRef.current?.click()}
                      leftIcon={<FolderPlus className="w-4 h-4 text-blue-600" />}
                    >
                      Upload Folder
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Top Bar with Bundle Summary */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FolderArchive className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {selectedFiles.length} {selectedFiles.length === 1 ? 'Item' : 'Items Selected'} ({formatBytes(totalFilesSize)})
                      </span>
                      {selectedFiles.length > 1 && (
                        <Badge variant="info" size="sm">Auto-ZIP Package</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        + Files
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => folderInputRef.current?.click()}
                        leftIcon={<FolderPlus className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        + Folder
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllFiles}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Individual Files List */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {selectedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                            <FileIcon className="h-4 w-4" />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-semibold text-slate-900 truncate max-w-sm">
                              {f.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {formatBytes(f.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(i)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEXT SHARING */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <Input
                label="Snippet Title (Optional)"
                placeholder="e.g. API Keys, Configuration, Meeting Notes"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                maxLength={100}
              />

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Text / Code Content
                  </label>
                  {textContent && (
                    <button
                      type="button"
                      onClick={() => setTextContent('')}
                      className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={8}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste passwords, code snippets, confidential notes, or sensitive tokens here..."
                    className="w-full rounded-xl bg-white border border-slate-200 p-4 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[160px] shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    {textCharCount} characters • {textWordCount} words
                  </span>
                  <span>Plaintext sanitized before render</span>
                </div>
              </div>
            </div>
          )}

          {/* ZERO-KNOWLEDGE CLIENT-SIDE E2EE OPTION */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
            enableE2ee
              ? 'bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-blue-50/90 border-blue-300/90 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.12)] ring-1 ring-blue-500/20'
              : 'bg-white/95 border-slate-200/80 shadow-2xs hover:border-slate-300'
          }`}>
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  enableE2ee
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                    : 'bg-blue-50 border border-blue-100 text-blue-600'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Zero-Knowledge Client Encryption
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-blue-800 border border-blue-200/60">
                      AES-GCM 256
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-xl">
                    Data encrypts locally in your browser before upload. Even server admins cannot read it.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 sm:mt-0">
                <input
                  type="checkbox"
                  checked={enableE2ee}
                  onChange={(e) => setEnableE2ee(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner" />
              </label>
            </div>

            {enableE2ee && (
              <div className="mt-3.5 pt-3 border-t border-blue-200/60 animate-fadeIn">
                <Input
                  label="Custom Decryption Key Phrase (Optional)"
                  type="password"
                  placeholder="Leave blank to use share password or enter dedicated key"
                  value={e2eeKeyPhrase}
                  onChange={(e) => setE2eeKeyPhrase(e.target.value)}
                  helperText="If left blank, the share password or PIN will be used as the decryption key."
                />
              </div>
            )}
          </div>

          {/* SECURITY & EXPIRATION SETTINGS */}
          <div className="space-y-4 pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-left">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <Sliders className="w-3 h-3 text-blue-600" />
                  Security & Constraints Suite
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Share Security & Constraints
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                Hardware-Grade Controls
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Left Column: Expiration & Password */}
              <div className="space-y-4">
                {/* Expiration Timer Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Expiration Time</span>
                        <span className="text-[11px] text-slate-500">Auto-destruct schedule</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {expiryOption === '600' && '10 Min'}
                      {expiryOption === '3600' && '1 Hour'}
                      {expiryOption === '86400' && '24 Hours'}
                      {expiryOption === '259200' && '3 Days'}
                      {expiryOption === '604800' && '7 Days'}
                      {expiryOption === 'custom' && `${customExpiryValue} ${customExpiryUnit}`}
                    </span>
                  </div>

                  {/* Segmented Preset Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                    {[
                      { id: '600', label: '10m' },
                      { id: '3600', label: '1h' },
                      { id: '86400', label: '24h' },
                      { id: '259200', label: '3d' },
                      { id: '604800', label: '7d' },
                      { id: 'custom', label: 'Custom' },
                    ].map((preset) => {
                      const isActive = expiryOption === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setExpiryOption(preset.id)}
                          className={`py-1.5 px-1 text-xs rounded-lg font-medium transition-all text-center ${
                            isActive
                              ? 'bg-white text-blue-600 font-bold shadow-xs border border-blue-200/60 ring-1 ring-blue-500/10'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {expiryOption === 'custom' && (
                    <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={customExpiryValue}
                        onChange={(e) => setCustomExpiryValue(e.target.value)}
                        className="w-24 rounded-xl bg-slate-50 border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Duration"
                      />
                      <select
                        value={customExpiryUnit}
                        onChange={(e) => setCustomExpiryUnit(e.target.value as 'hours' | 'days')}
                        className="flex-1 rounded-xl bg-slate-50 border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Bcrypt Password Lock Card */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
                  enablePassword
                    ? 'bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                    : 'bg-white/95 border-slate-200/80 shadow-2xs hover:border-slate-300'
                }`}>
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        enablePassword
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                      }`}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Bcrypt Password Lock</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200/60">
                            Bcrypt
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">Require an extra password</span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={enablePassword}
                        onChange={(e) => setEnablePassword(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 shadow-inner" />
                    </label>
                  </div>

                  {enablePassword ? (
                    <div className="pt-2 animate-fadeIn space-y-1.5">
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter decryption password..."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl bg-white border border-indigo-200 py-2.5 pl-3.5 pr-10 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-indigo-700 font-medium">
                        Recipient must provide this password in addition to the 6-digit PIN.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      Anyone with the 6-digit code can access. Enable to require an extra password.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Download Limit, Burn on Download, Allow Download */}
              <div className="space-y-4">
                {/* Download Limit Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-2xs">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Download Limit</span>
                        <span className="text-[11px] text-slate-500">Maximum allowed downloads</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                      {maxDownloadsOption === 'unlimited' && 'Unlimited'}
                      {maxDownloadsOption === '1' && '1 DL Only'}
                      {maxDownloadsOption === '5' && '5 DL'}
                      {maxDownloadsOption === '10' && '10 DL'}
                      {maxDownloadsOption === '25' && '25 DL'}
                      {maxDownloadsOption === 'custom' && `Custom (${customMaxDownloads})`}
                    </span>
                  </div>

                  {/* Segmented Preset Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                    {(
                      [
                        { id: 'unlimited', label: '∞' },
                        { id: '1', label: '1' },
                        { id: '5', label: '5' },
                        { id: '10', label: '10' },
                        { id: '25', label: '25' },
                        { id: 'custom', label: 'Custom' },
                      ] as const
                    ).map((preset) => {
                      const isActive = maxDownloadsOption === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setMaxDownloadsOption(preset.id)}
                          className={`py-1.5 px-1 text-xs rounded-lg font-medium transition-all text-center ${
                            isActive
                              ? 'bg-white text-blue-600 font-bold shadow-xs border border-blue-200/60 ring-1 ring-blue-500/10'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {maxDownloadsOption === 'custom' && (
                    <div className="pt-1 animate-fadeIn">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={customMaxDownloads}
                        onChange={(e) => setCustomMaxDownloads(e.target.value)}
                        placeholder="Enter maximum download count"
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Burn on First Download (Auto-Destruct Shredder) */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                  burnAfterDownload
                    ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-400 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30'
                    : 'bg-white/95 border-slate-200/80 shadow-2xs hover:border-amber-200/80'
                }`}>
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        burnAfterDownload
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm ring-2 ring-amber-400/40 animate-pulse'
                          : 'bg-amber-50 border border-amber-100 text-amber-600'
                      }`}>
                        <Flame className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            Burn on First Download
                          </span>
                          {burnAfterDownload ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              SHRED ARMED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Off
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500">
                          Permanently shred and zero-wipe payload from cloud storage immediately after first download.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 sm:mt-0">
                      <input
                        type="checkbox"
                        checked={burnAfterDownload}
                        onChange={(e) => setBurnAfterDownload(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 shadow-inner" />
                    </label>
                  </div>
                </div>

                {/* Allow File Download (Binary vs View Only) */}
                {activeTab === 'file' && (
                  <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                    allowDownload
                      ? 'bg-gradient-to-br from-blue-50/50 via-white to-slate-50 border-blue-200/90 shadow-2xs'
                      : 'bg-slate-50/80 border-slate-200/90 shadow-2xs'
                  }`}>
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          allowDownload
                            ? 'bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs'
                            : 'bg-slate-100 border border-slate-200 text-slate-500'
                        }`}>
                          <Eye className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              Allow File Download
                            </span>
                            {allowDownload ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                Download Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                                Browser View Only
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500">
                            {allowDownload
                              ? 'Recipients can download and save files directly.'
                              : 'Recipients can only preview files inside the browser; download blocked.'}
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={(e) => setAllowDownload(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isSubmitting && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                  {progressStatus}
                </span>
                <span className="font-mono font-bold text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-blue-100/80 overflow-hidden p-0.5 border border-blue-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all duration-300 shadow-sm"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Fast TLS 1.3 Ephemeral Stream</span>
                <span>{uploadProgress < 100 ? 'Processing...' : 'Completed'}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="glow"
            size="lg"
            shakeOnHover={true}
            shimmer={true}
            className="w-full text-base py-4"
            isLoading={isSubmitting}
            leftIcon={<KeyRound className="w-5 h-5 text-white" />}
          >
            {isSubmitting ? 'Creating Ephemeral Share...' : 'Generate 6-Digit Code'}
          </Button>
        </form>
      </Card>

      {/* Result Modal */}
      {resultData && (
        <ShareResultModal
          isOpen={resultModalOpen}
          onClose={() => setResultModalOpen(false)}
          shareCode={resultData.shareCode}
          shareId={resultData.shareId}
          expiresAt={resultData.expiresAt}
          shareType={activeTab}
          fileName={
            selectedFiles.length > 1
              ? `${selectedFiles.length} files (ZIP Bundle)`
              : selectedFiles[0]?.name || textTitle
          }
          fileSize={
            selectedFiles.length > 0
              ? totalFilesSize
              : textContent.length
          }
          isPasswordProtected={enablePassword || enableE2ee}
          maxDownloads={
            maxDownloadsOption === 'custom'
              ? parseInt(customMaxDownloads, 10)
              : maxDownloadsOption !== 'unlimited'
              ? parseInt(maxDownloadsOption, 10)
              : null
          }
          burnAfterDownload={burnAfterDownload}
          onReset={handleResetForm}
        />
      )}
    </div>
  );
}
