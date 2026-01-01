import express, { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting: in-memory map by IP
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

// Rate limiting middleware
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Maximum ${MAX_REQUESTS} requests per minute allowed`
    });
  }
  
  entry.count++;
  next();
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

// Validate TikTok URL
const isValidTikTokUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === 'www.tiktok.com' || parsed.hostname === 'tiktok.com' || parsed.hostname === 'vm.tiktok.com') &&
      (parsed.pathname.includes('/video/') || parsed.pathname.includes('/@'))
    );
  } catch {
    return false;
  }
};

// Extract video ID from TikTok URL
const extractVideoId = (url: string): string | null => {
  try {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// Get random User-Agent
const getRandomUserAgent = (): string => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

// Extract direct video URL using yt-dlp
const extractVideoUrl = async (tiktokUrl: string): Promise<string> => {
  try {
    // Use yt-dlp to get the direct video URL (no watermark)
    const command = `yt-dlp -g --no-warnings "${tiktokUrl}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(`yt-dlp error: ${stderr}`);
    }
    
    const url = stdout.trim();
    if (!url || !url.startsWith('http')) {
      throw new Error('Failed to extract video URL');
    }
    
    return url;
  } catch (error: any) {
    throw new Error(`Video extraction failed: ${error.message}`);
  }
};

// Stream video with Range request support
const streamVideo = async (
  videoUrl: string,
  req: Request,
  res: Response
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const userAgent = getRandomUserAgent();
    const parsedUrl = new URL(videoUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    // Parse Range header if present
    const range = req.headers.range;
    const options: any = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/',
        ...(range && { Range: range })
      }
    };
    
    const proxyReq = client.request(options, (proxyRes) => {
      // Forward status code
      res.status(proxyRes.statusCode || 200);
      
      // Forward headers
      const headers: Record<string, string> = {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      };
      
      // Forward Content-Length if available
      if (proxyRes.headers['content-length']) {
        headers['Content-Length'] = proxyRes.headers['content-length'];
      }
      
      // Forward Content-Range if available (for partial content)
      if (proxyRes.headers['content-range']) {
        headers['Content-Range'] = proxyRes.headers['content-range'];
        res.status(206); // Partial Content
      }
      
      // Set Content-Disposition
      const videoId = extractVideoId(req.query.url as string) || 'video';
      headers['Content-Disposition'] = `attachment; filename="tiktok-${videoId}.mp4"`;
      
      // Set all headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Pipe the response
      proxyRes.pipe(res);
      
      proxyRes.on('end', () => resolve());
      proxyRes.on('error', (err) => reject(err));
    });
    
    proxyReq.on('error', (err) => reject(err));
    proxyReq.end();
  });
};

// Main download endpoint
app.get('/download', rateLimiter, async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    
    // Input validation
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        message: 'Please provide a TikTok video URL in the query parameter: ?url=<tiktok_url>'
      });
    }
    
    if (!isValidTikTokUrl(url)) {
      return res.status(400).json({
        error: 'Invalid TikTok URL',
        message: 'Please provide a valid TikTok video URL'
      });
    }
    
    // Extract direct video URL
    let videoUrl: string;
    try {
      videoUrl = await extractVideoUrl(url);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Extraction failed',
        message: error.message || 'Failed to extract video URL. The video might be private or unavailable.'
      });
    }
    
    // Stream video to client
    try {
      await streamVideo(videoUrl, req, res);
    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Streaming failed',
          message: error.message || 'Failed to stream video'
        });
      }
    }
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`TikTok Downloader API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Download endpoint: http://localhost:${PORT}/download?url=<tiktok_url>`);
});

