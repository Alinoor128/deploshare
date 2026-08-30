'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  FileIcon,
  Code2,
  Table as TableIcon,
  Music,
  Copy,
  Check,
} from 'lucide-react';
import { ConfidentialShield } from '@/components/security/ConfidentialShield';

interface AdvancedFilePreviewProps {
  previewUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  textContent?: string | null;
  shareCode: string;
}

export function AdvancedFilePreview({
  previewUrl,
  fileName,
  mimeType,
  textContent,
  shareCode,
}: AdvancedFilePreviewProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const lowerName = (fileName || '').toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  const isImage = lowerMime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lowerName);
  const isPdf = lowerMime === 'application/pdf' || lowerName.endsWith('.pdf');
  const isVideo = lowerMime.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(lowerName);
  const isAudio = lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(lowerName);
  const isCsv = lowerMime === 'text/csv' || lowerName.endsWith('.csv');
  const isCode =
    Boolean(textContent) ||
    /\.(js|jsx|ts|tsx|py|go|rs|java|c|cpp|h|json|sql|html|css|scss|yaml|yml|sh|bash|env|xml|md)$/i.test(lowerName);

  // Language Detection
  const detectedLanguage = useMemo(() => {
    if (lowerName.endsWith('.ts') || lowerName.endsWith('.tsx')) return 'TypeScript';
    if (lowerName.endsWith('.js') || lowerName.endsWith('.jsx')) return 'JavaScript';
    if (lowerName.endsWith('.py')) return 'Python';
    if (lowerName.endsWith('.rs')) return 'Rust';
    if (lowerName.endsWith('.go')) return 'Go';
    if (lowerName.endsWith('.json')) return 'JSON';
    if (lowerName.endsWith('.sql')) return 'SQL';
    if (lowerName.endsWith('.html')) return 'HTML';
    if (lowerName.endsWith('.css')) return 'CSS';
    if (lowerName.endsWith('.sh') || lowerName.endsWith('.bash')) return 'Bash / Shell';
    if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) return 'YAML';
    if (lowerName.endsWith('.md')) return 'Markdown';
    return 'Code';
  }, [lowerName]);

  // CSV parser for simple table view
  const csvRows = useMemo(() => {
    if (!isCsv || !textContent) return [];
    try {
      const lines = textContent.trim().split('\n');
      return lines.slice(0, 50).map((line) => {
        return line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      });
    } catch {
      return [];
    }
  }, [isCsv, textContent]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <ConfidentialShield shareCode={shareCode}>
      {/* 1. IMAGE PREVIEW */}
      {previewUrl && isImage && (
        <div className="flex justify-center bg-slate-50 rounded-xl p-4 border border-slate-200">
          <Image
            src={previewUrl}
            alt={fileName || 'Preview'}
            width={800}
            height={500}
            className="max-h-[500px] w-auto rounded-lg object-contain"
            unoptimized
          />
        </div>
      )}

      {/* 2. PDF PREVIEW */}
      {previewUrl && isPdf && (
        <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <iframe
            src={`${previewUrl}#toolbar=0`}
            className="w-full h-full"
            title="PDF Preview"
          />
        </div>
      )}

      {/* 3. VIDEO STREAM PLAYER */}
      {previewUrl && isVideo && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-2">
          <video
            controls
            controlsList="nodownload"
            className="w-full max-h-[500px] rounded-lg mx-auto"
          >
            <source src={previewUrl} type={mimeType || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* 4. AUDIO STREAM PLAYER */}
      {previewUrl && isAudio && (
        <div className="p-6 rounded-xl border border-blue-200 bg-blue-50/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Music className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{fileName || 'Audio Track'}</h4>
              <p className="text-xs text-slate-500">In-Browser Stream Preview</p>
            </div>
          </div>
          <audio controls className="w-full" controlsList="nodownload">
            <source src={previewUrl} type={mimeType || 'audio/mpeg'} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* 5. CSV DATA TABLE PREVIEW */}
      {isCsv && csvRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <TableIcon className="w-4 h-4 text-blue-600" />
              CSV Spreadsheet Table (First {csvRows.length} rows)
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              {csvRows[0] && (
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    {csvRows[0].map((col, idx) => (
                      <th key={idx} className="px-3.5 py-2.5">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-100 font-mono">
                {csvRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-blue-50/20">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-800 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CODE & CONFIG SYNTAX PREVIEW */}
      {isCode && textContent && !isCsv && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-cyan-300">{detectedLanguage}</span>
            </div>
            <button
              onClick={() => handleCopy(textContent)}
              className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 font-mono text-xs text-cyan-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[500px]">
            {textContent.split('\n').map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell pr-4 text-slate-600 select-none text-right w-8">
                  {idx + 1}
                </span>
                <span className="table-cell">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. FALLBACK GENERIC FILE CARD */}
      {!isImage && !isPdf && !isVideo && !isAudio && !isCsv && !isCode && (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <FileIcon className="h-10 w-10 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-700">
            Preview unavailable for this binary format
          </h4>
          <p className="text-xs text-slate-500 max-w-sm">
            This file format cannot be rendered in browser preview. Please download the file to inspect its content safely.
          </p>
        </div>
      )}
    </ConfidentialShield>
  );
}
