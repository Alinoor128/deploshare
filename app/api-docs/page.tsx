'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DeploShareLogo } from '@/components/ui/DeploShareLogo';
import {
  Code2,
  Terminal,
  Key,
  Copy,
  Check,
  Shield,
} from 'lucide-react';

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlCreateText = `curl -X POST https://deploshare.com/api/v1/shares \\
  -H "Authorization: Bearer dps_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Database Config",
    "textContent": "DATABASE_URL=postgres://...",
    "expirySeconds": 86400,
    "burnAfterDownload": true
  }'`;

  const curlCreateFile = `curl -X POST https://deploshare.com/api/v1/shares \\
  -H "Authorization: Bearer dps_live_YOUR_API_KEY" \\
  -F "file=@/path/to/archive.zip" \\
  -F "expirySeconds=3600" \\
  -F "burnAfterDownload=true"`;

  const jsSnippet = `// 1. Create a 6-Digit Share via JavaScript / Node.js
const response = await fetch("https://deploshare.com/api/v1/shares", {
  method: "POST",
  headers: {
    "Authorization": "Bearer dps_live_YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Confidential Tokens",
    textContent: "SECRET_KEY_9921",
    expirySeconds: 3600,
    burnAfterDownload: true,
  }),
});

const result = await response.json();
console.log("6-Digit Code:", result.data.shareCode); // e.g. "583214"
console.log("Access Link:", result.data.accessUrl);`;

  const pythonSnippet = `# 1. Create a 6-Digit Share via Python
import requests

url = "https://deploshare.com/api/v1/shares"
headers = {
    "Authorization": "Bearer dps_live_YOUR_API_KEY",
}

# Example A: Upload File
files = {"file": open("deployment.tar.gz", "rb")}
data = {"burnAfterDownload": "true", "expirySeconds": "7200"}
res = requests.post(url, headers=headers, files=files, data=data)
print("Share PIN:", res.json()["data"]["shareCode"])

# Example B: Retrieve Share by Code
get_url = "https://deploshare.com/api/v1/shares/583214"
share_data = requests.get(get_url).json()
print("Decrypted Content:", share_data["data"])`;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <DeploShareLogo size="md" showText={true} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Code2 className="w-3.5 h-3.5" />
          <span>DeploShare REST API v1.0</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Developer REST API Reference
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
          Integrate secure, code-only temporary file transfers, ephemeral text snippets, and self-destructing shares directly into your CI/CD pipelines, CLI scripts, and web apps.
        </p>

        <div className="flex justify-center gap-3 pt-2">
          <Link href="/settings">
            <Button variant="glow" size="sm" leftIcon={<Key className="w-4 h-4" />}>
              Get Your API Key
            </Button>
          </Link>
        </div>
      </div>

      {/* Authentication Guide */}
      <Card glow className="p-6 sm:p-8 space-y-4 bg-white border-blue-200 shadow-md">
        <div className="flex items-center gap-2.5 text-blue-600 pb-2 border-b border-slate-100">
          <Shield className="w-5 h-5" />
          <h2 className="text-lg font-bold text-slate-900">Authentication</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          All endpoints requiring authentication accept your secret API key via standard Bearer token header or the custom <code className="text-blue-600 font-mono font-semibold">x-api-key</code> header:
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-blue-300 space-y-1">
          <p>Authorization: Bearer dps_live_4f8a91c0e2...</p>
          <p className="text-slate-500">{`// or`}</p>
          <p>x-api-key: dps_live_4f8a91c0e2...</p>
        </div>
      </Card>

      {/* Code Language Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            Quick Start SDK Examples
          </h2>

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            {(['curl', 'js', 'python'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'curl' && (
          <div className="space-y-4">
            <Card className="p-5 space-y-2 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">1. Create Text Share</span>
                <button
                  onClick={() => handleCopy(curlCreateText, 'curl1')}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                >
                  {copiedSection === 'curl1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSection === 'curl1' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                {curlCreateText}
              </pre>
            </Card>

            <Card className="p-5 space-y-2 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">2. Upload File (Multipart)</span>
                <button
                  onClick={() => handleCopy(curlCreateFile, 'curl2')}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                >
                  {copiedSection === 'curl2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSection === 'curl2' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                {curlCreateFile}
              </pre>
            </Card>
          </div>
        )}

        {activeTab === 'js' && (
          <Card className="p-5 space-y-2 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-900">JavaScript / TypeScript Fetch</span>
              <button
                onClick={() => handleCopy(jsSnippet, 'js')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                {copiedSection === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'js' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {jsSnippet}
            </pre>
          </Card>
        )}

        {activeTab === 'python' && (
          <Card className="p-5 space-y-2 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-900">Python Requests</span>
              <button
                onClick={() => handleCopy(pythonSnippet, 'py')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                {copiedSection === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'py' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {pythonSnippet}
            </pre>
          </Card>
        )}
      </div>

      {/* Comprehensive Endpoint Specifications */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-200">
          Endpoint Specifications
        </h2>

        {/* 1. POST /api/v1/shares */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="success" size="md">POST</Badge>
            <span className="font-mono text-base font-bold text-slate-900">/api/v1/shares</span>
          </div>
          <p className="text-xs text-slate-500">
            Creates a new temporary file or text share and returns a unique 6-digit numeric PIN.
          </p>

          <div className="space-y-2 text-xs">
            <strong className="text-slate-800 block">Request Parameters (JSON or Multipart):</strong>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><code className="text-slate-900 font-mono font-semibold">file</code> (File, optional): Binary file to upload</li>
              <li><code className="text-slate-900 font-mono font-semibold">textContent</code> (String, optional): Plaintext or code snippet</li>
              <li><code className="text-slate-900 font-mono font-semibold">title</code> (String, optional): Display name for the share</li>
              <li><code className="text-slate-900 font-mono font-semibold">expirySeconds</code> (Integer, optional): Duration in seconds (default: 86400)</li>
              <li><code className="text-slate-900 font-mono font-semibold">password</code> (String, optional): bcrypt encrypted password</li>
              <li><code className="text-slate-900 font-mono font-semibold">maxDownloads</code> (Integer, optional): Max allowed downloads</li>
              <li><code className="text-slate-900 font-mono font-semibold">burnAfterDownload</code> (Boolean, optional): Self-destruct after first download</li>
            </ul>
          </div>
        </Card>

        {/* 2. GET /api/v1/shares/[code] */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="info" size="md">GET</Badge>
            <span className="font-mono text-base font-bold text-slate-900">/api/v1/shares/:code</span>
          </div>
          <p className="text-xs text-slate-500">
            Retrieve share metadata and content by 6-digit code.
          </p>
          <div className="space-y-2 text-xs">
            <strong className="text-slate-800 block">Headers:</strong>
            <p className="text-slate-600"><code className="text-slate-900 font-mono font-semibold">x-share-password</code> (optional): Required if the share is password-protected.</p>
          </div>
        </Card>

        {/* 3. GET /api/v1/shares/[code]/download */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="info" size="md">GET</Badge>
            <span className="font-mono text-base font-bold text-slate-900">/api/v1/shares/:code/download</span>
          </div>
          <p className="text-xs text-slate-500">
            Streams or redirects directly to the ephemeral signed download URL for the file.
          </p>
        </Card>

        {/* 4. DELETE /api/v1/shares/[code] */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="danger" size="md">DELETE</Badge>
            <span className="font-mono text-base font-bold text-slate-900">/api/v1/shares/:code</span>
          </div>
          <p className="text-xs text-slate-500">
            Revoke and permanently purge a share by 6-digit code. Must be the share owner or admin.
          </p>
        </Card>

        {/* 5. GET /api/v1/shares */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="info" size="md">GET</Badge>
            <span className="font-mono text-base font-bold text-slate-900">/api/v1/shares</span>
          </div>
          <p className="text-xs text-slate-500">
            List all shares created by the authenticated developer account with pagination (<code className="text-blue-600 font-mono">?page=1&limit=20</code>).
          </p>
        </Card>
      </div>
    </div>
  );
}
