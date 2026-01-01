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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            TikTok Video Downloader
          </CardTitle>
          <CardDescription className="text-lg">
            Download TikTok videos without watermarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="Paste TikTok URL here (e.g., https://www.tiktok.com/@user/video/123 or https://vt.tiktok.com/ABC123)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="h-12 text-base"
            />
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
          </div>
          <Button
            onClick={handleDownload}
            disabled={loading || !url.trim()}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
          <div className="pt-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold">Supported URL formats:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>https://www.tiktok.com/@username/video/1234567890</li>
              <li>https://vt.tiktok.com/ABC123/</li>
              <li>https://vm.tiktok.com/XYZ789/</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
