'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return;
    }

    // Basic URL validation
    const tiktokUrlPattern = /(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/;
    if (!tiktokUrlPattern.test(url)) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Trigger download - use absolute path since we're at /web
      const downloadUrl = `${window.location.origin}/download?url=${encodeURIComponent(url)}`;
      window.open(downloadUrl, '_blank');
      
      // Reset after a delay
      setTimeout(() => {
        setLoading(false);
        setUrl('');
      }, 2000);
    } catch (err) {
      setError('Failed to download video. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleDownload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-2xl border border-white/10 bg-black">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-medium text-white">
            TikTok Video Downloader
          </CardTitle>
          <CardDescription className="text-white/60 text-sm">
            Download TikTok videos without watermarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="Paste TikTok URL here"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="h-12 text-base bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
            />
            {error && (
              <p className="text-sm text-white/80 font-medium">{error}</p>
            )}
          </div>
          <Button
            onClick={handleDownload}
            disabled={loading || !url.trim()}
            className="w-full h-12 text-base font-medium bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </span>
            ) : (
              'Download Video'
            )}
          </Button>
          <div className="pt-4 space-y-2 text-xs text-white/40">
            <p className="font-medium text-white/60">Supported formats:</p>
            <ul className="space-y-1">
              <li>tiktok.com/@user/video/123</li>
              <li>vt.tiktok.com/ABC123</li>
              <li>vm.tiktok.com/XYZ789</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
