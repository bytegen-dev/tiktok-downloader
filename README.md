# TikTok Video Downloader API

A lightweight, production-ready TypeScript API for downloading TikTok videos without watermarks. Built with Express.js and yt-dlp.

## Features

- 🚀 **Single endpoint** - Simple GET request with TikTok URL
- 💧 **No watermark** - Downloads clean videos directly
- 📦 **Streaming** - Efficiently streams videos without saving to disk
- ⚡ **Range requests** - Supports video seeking and partial content
- 🛡️ **Rate limiting** - 5 requests per minute per IP
- 🔒 **Error handling** - Graceful handling of invalid URLs, private videos, etc.
- 🚂 **Railway ready** - Pre-configured for easy deployment

## Prerequisites

- Node.js 18+ 
- Python 3.x (for yt-dlp)
- yt-dlp installed globally: `pip install yt-dlp`

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tiktok-downloader
```

2. Install dependencies:
```bash
npm install
```

3. Ensure yt-dlp is installed:
```bash
pip install yt-dlp
```

## Usage

### Development

Run in development mode with hot reload:
```bash
npm run dev
```

### Production

Build and start:
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Download Video

**GET** `/download?url=<tiktok_video_url>`

Downloads a TikTok video without watermark.

**Query Parameters:**
- `url` (required) - The TikTok video URL

**Example:**
```bash
curl "http://localhost:3000/download?url=https://www.tiktok.com/@username/video/1234567890" --output video.mp4
```

**Response:**
- Success: Video stream with headers:
  - `Content-Type: video/mp4`
  - `Content-Disposition: attachment; filename="tiktok-[id].mp4"`
  - `Accept-Ranges: bytes`
  - `Content-Length: <size>`
- Error: JSON response with error details

**Error Responses:**
```json
{
  "error": "Missing URL parameter",
  "message": "Please provide a TikTok video URL in the query parameter: ?url=<tiktok_url>"
}
```

```json
{
  "error": "Invalid TikTok URL",
  "message": "Please provide a valid TikTok video URL"
}
```

```json
{
  "error": "Extraction failed",
  "message": "Failed to extract video URL. The video might be private or unavailable."
}
```

```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 5 requests per minute allowed"
}
```

### Health Check

**GET** `/health`

Returns API status.

**Example:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- **Limit**: 5 requests per minute per IP address
- **Window**: 60 seconds
- **Response**: 429 Too Many Requests when exceeded

## Deployment

### Railway

This project is pre-configured for Railway deployment:

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Railway will automatically detect the configuration and deploy

The `nixpacks.toml` file ensures:
- Node.js 20 is installed
- Python 3 and ffmpeg are available
- yt-dlp is installed during build
- The app is built and started correctly

### Environment Variables

- `PORT` - Server port (default: 3000)

## Project Structure

```
tiktok-downloader/
├── src/
│   └── server.ts          # Main server file
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── railway.json           # Railway deployment config
├── nixpacks.toml          # Railway build config
└── README.md              # This file
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Type check without building

### How It Works

1. **URL Validation**: Validates the provided TikTok URL format
2. **Video Extraction**: Uses `yt-dlp` to extract the direct video URL (no watermark)
3. **Streaming**: Proxies the video stream directly to the client
4. **Headers**: Sets proper headers for video download and seeking support
5. **Error Handling**: Catches and returns user-friendly error messages

## Notes

- Videos are streamed directly without being saved to disk
- Random User-Agent headers are used to reduce blocking risk
- Range requests are supported for video seeking
- Rate limiting uses in-memory storage (resets on server restart)

## License

MIT

