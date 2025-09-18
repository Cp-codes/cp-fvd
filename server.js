const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Facebook video downloader class
class FacebookVideoDownloader {
    constructor() {
        this.userAgent = new UserAgent();
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        };
    }

    // Extract video ID from Facebook URL
    extractVideoId(url) {
        const patterns = [
            /facebook\.com\/.*\/videos\/(\d+)/,
            /fb\.watch\/([a-zA-Z0-9_-]+)/,
            /facebook\.com\/watch\/\?v=(\d+)/,
            /facebook\.com\/.*\/posts\/(\d+)/,
            /facebook\.com\/video\.php\?v=(\d+)/,
            /facebook\.com\/.*\/videos\/vb\.\d+\/(\d+)/,
            /facebook\.com\/reel\/(\d+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    // Convert various Facebook URL formats to a standard format
    normalizeUrl(url) {
        try {
            // Handle fb.watch URLs
            if (url.includes('fb.watch')) {
                const videoId = this.extractVideoId(url);
                if (videoId) {
                    return `https://www.facebook.com/watch/?v=${videoId}`;
                }
            }

            // Handle mobile URLs
            if (url.includes('m.facebook.com')) {
                return url.replace('m.facebook.com', 'www.facebook.com');
            }

            // Handle reel URLs
            if (url.includes('/reel/')) {
                const videoId = this.extractVideoId(url);
                if (videoId) {
                    return `https://www.facebook.com/watch/?v=${videoId}`;
                }
            }

            return url;
        } catch (error) {
            console.error('Error normalizing URL:', error);
            return url;
        }
    }

    // Get video details and download links
    async getVideoDetails(videoUrl) {
        try {
            console.log('Processing Facebook URL:', videoUrl);
            
            const normalizedUrl = this.normalizeUrl(videoUrl);
            console.log('Normalized URL:', normalizedUrl);

            // Method 1: Try direct page scraping
            const directResult = await this.extractFromDirectPage(normalizedUrl);
            if (directResult.success && directResult.downloadLinks.length > 0) {
                return directResult;
            }

            // Method 2: Try mobile version
            const mobileResult = await this.extractFromMobilePage(normalizedUrl);
            if (mobileResult.success && mobileResult.downloadLinks.length > 0) {
                return mobileResult;
            }

            // Method 3: Try embedded video approach
            const embedResult = await this.extractFromEmbedded(normalizedUrl);
            if (embedResult.success && embedResult.downloadLinks.length > 0) {
                return embedResult;
            }

            // If all methods fail, return error
            return {
                success: false,
                error: 'Unable to extract video. The video might be private, deleted, or require login.'
            };

        } catch (error) {
            console.error('Error in getVideoDetails:', error.message);
            return {
                success: false,
                error: 'Failed to process the video URL. Please check if the URL is valid and the video is public.'
            };
        }
    }

    // Method 1: Extract from direct Facebook page
    async extractFromDirectPage(url) {
        try {
            console.log('Trying direct page extraction...');
            
            const response = await axios.get(url, {
                headers: this.headers,
                timeout: 15000,
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            
            // Extract basic info
            let title = $('title').text() || 
                       $('meta[property="og:title"]').attr('content') || 
                       'Facebook Video';
            
            title = title.replace(/\s*\|\s*Facebook\s*$/, '').trim();

            const thumbnail = $('meta[property="og:image"]').attr('content') || 
                            $('meta[name="twitter:image"]').attr('content');

            const duration = $('meta[property="video:duration"]').attr('content');

            // Extract video URLs using multiple patterns
            const videoUrls = this.extractVideoUrlsFromHtml(response.data);

            if (videoUrls.length > 0) {
                return {
                    success: true,
                    title: title,
                    thumbnail: thumbnail,
                    duration: this.formatDuration(duration),
                    downloadLinks: videoUrls
                };
            }

            return { success: false };

        } catch (error) {
            console.error('Direct page extraction failed:', error.message);
            return { success: false };
        }
    }

    // Method 2: Extract from mobile Facebook page
    async extractFromMobilePage(url) {
        try {
            console.log('Trying mobile page extraction...');
            
            const mobileUrl = url.replace('www.facebook.com', 'm.facebook.com');
            
            const mobileHeaders = {
                ...this.headers,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
            };

            const response = await axios.get(mobileUrl, {
                headers: mobileHeaders,
                timeout: 15000,
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            
            const title = $('title').text().replace(/\s*\|\s*Facebook\s*$/, '').trim() || 'Facebook Video';
            const thumbnail = $('meta[property="og:image"]').attr('content');

            const videoUrls = this.extractVideoUrlsFromHtml(response.data);

            if (videoUrls.length > 0) {
                return {
                    success: true,
                    title: title,
                    thumbnail: thumbnail,
                    duration: '0:00',
                    downloadLinks: videoUrls
                };
            }

            return { success: false };

        } catch (error) {
            console.error('Mobile page extraction failed:', error.message);
            return { success: false };
        }
    }

    // Method 3: Extract from embedded video
    async extractFromEmbedded(url) {
        try {
            console.log('Trying embedded video extraction...');
            
            const videoId = this.extractVideoId(url);
            if (!videoId) return { success: false };

            const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
            
            const response = await axios.get(embedUrl, {
                headers: this.headers,
                timeout: 15000
            });

            const videoUrls = this.extractVideoUrlsFromHtml(response.data);

            if (videoUrls.length > 0) {
                return {
                    success: true,
                    title: 'Facebook Video',
                    thumbnail: null,
                    duration: '0:00',
                    downloadLinks: videoUrls
                };
            }

            return { success: false };

        } catch (error) {
            console.error('Embedded extraction failed:', error.message);
            return { success: false };
        }
    }

    // Extract video URLs from HTML content using comprehensive patterns
    extractVideoUrlsFromHtml(htmlContent) {
        const videoUrls = [];
        const foundUrls = new Set();
        
        try {
            // Pattern 1: HD and SD video sources
            const patterns = [
                // High quality patterns
                /"hd_src":"([^"]+)"/g,
                /"hd_src_no_ratelimit":"([^"]+)"/g,
                /"browser_native_hd_url":"([^"]+)"/g,
                
                // Standard quality patterns
                /"sd_src":"([^"]+)"/g,
                /"sd_src_no_ratelimit":"([^"]+)"/g,
                /"browser_native_sd_url":"([^"]+)"/g,
                
                // General video patterns
                /"playable_url":"([^"]+)"/g,
                /"playable_url_quality_hd":"([^"]+)"/g,
                /"video_url":"([^"]+)"/g,
                /"src":"([^"]*\.mp4[^"]*)"/g,
                
                // Alternative patterns
                /"dash_manifest":"([^"]+)"/g,
                /"progressive_url":"([^"]+)"/g
            ];

            const qualityMap = {
                'hd_src': 'HD (1080p)',
                'hd_src_no_ratelimit': 'HD (1080p)',
                'browser_native_hd_url': 'HD (720p)',
                'sd_src': 'SD (480p)',
                'sd_src_no_ratelimit': 'SD (480p)', 
                'browser_native_sd_url': 'SD (360p)',
                'playable_url': 'Standard',
                'playable_url_quality_hd': 'HD',
                'video_url': 'Standard',
                'src': 'Mobile',
                'progressive_url': 'Progressive'
            };

            patterns.forEach((pattern, index) => {
                let match;
                while ((match = pattern.exec(htmlContent)) !== null) {
                    let url = match[1];
                    
                    // Clean up the URL
                    url = url.replace(/\\u0025/g, '%')
                           .replace(/\\u0026/g, '&')
                           .replace(/\\\//g, '/')
                           .replace(/\\/g, '');

                    // Decode URL if needed
                    try {
                        url = decodeURIComponent(url);
                    } catch (e) {
                        // If decoding fails, use original URL
                    }

                    if (this.isValidVideoUrl(url) && !foundUrls.has(url)) {
                        foundUrls.add(url);
                        
                        // Determine quality based on pattern
                        let quality = 'Standard';
                        let size = '~30MB';
                        
                        if (url.includes('hd') || pattern.source.includes('hd')) {
                            quality = 'HD (720p)';
                            size = '~50MB';
                        } else if (url.includes('sd') || pattern.source.includes('sd')) {
                            quality = 'SD (480p)';
                            size = '~25MB';
                        } else if (pattern.source.includes('src')) {
                            quality = 'Mobile (360p)';
                            size = '~15MB';
                        }

                        videoUrls.push({
                            quality: quality,
                            format: 'MP4',
                            size: size,
                            url: url
                        });
                    }
                }
            });

            // Pattern 2: Look for JSON data containing video info
            const jsonPattern = /\{"video_id":"[^"]+","video_url":"([^"]+)"/g;
            let jsonMatch;
            while ((jsonMatch = jsonPattern.exec(htmlContent)) !== null) {
                let url = jsonMatch[1].replace(/\\/g, '');
                if (this.isValidVideoUrl(url) && !foundUrls.has(url)) {
                    foundUrls.add(url);
                    videoUrls.push({
                        quality: 'Standard',
                        format: 'MP4',
                        size: '~30MB',
                        url: url
                    });
                }
            }

            // Sort by quality (HD first)
            videoUrls.sort((a, b) => {
                const qualityOrder = { 'HD': 3, 'SD': 2, 'Mobile': 1, 'Standard': 0 };
                const aOrder = qualityOrder[a.quality.split(' ')[0]] || 0;
                const bOrder = qualityOrder[b.quality.split(' ')[0]] || 0;
                return bOrder - aOrder;
            });

            console.log(`Found ${videoUrls.length} video URLs`);
            return videoUrls;

        } catch (error) {
            console.error('Error extracting video URLs:', error.message);
            return [];
        }
    }

    // Validate if URL is a valid video URL
    isValidVideoUrl(url) {
        if (!url || typeof url !== 'string' || url.length < 10) return false;
        
        try {
            const urlObj = new URL(url);
            
            // Check for video-related domains and indicators
            const validDomains = [
                'video.xx.fbcdn.net',
                'scontent.xx.fbcdn.net',
                'video.fxx',
                'scontent-',
                'fbcdn.net'
            ];

            const hasValidDomain = validDomains.some(domain => url.includes(domain));
            const hasVideoIndicators = url.includes('.mp4') || url.includes('video') || url.includes('type=video');
            
            return hasValidDomain && hasVideoIndicators && urlObj.protocol.startsWith('http');
        } catch {
            return false;
        }
    }

    // Format duration
    formatDuration(seconds) {
        if (!seconds || seconds === '0:00') return '0:00';
        
        const num = parseInt(seconds);
        if (isNaN(num)) return seconds;
        
        const hours = Math.floor(num / 3600);
        const minutes = Math.floor((num % 3600) / 60);
        const secs = num % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
}

// Create downloader instance
const downloader = new FacebookVideoDownloader();

// API endpoint to fetch video details
app.post('/api/video-details', async (req, res) => {
    try {
        const { videoUrl } = req.body;
        
        if (!videoUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Video URL is required' 
            });
        }

        // Validate Facebook URL
        const facebookUrlPattern = /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.watch)/i;
        if (!facebookUrlPattern.test(videoUrl)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide a valid Facebook video URL' 
            });
        }

        console.log('Processing request for:', videoUrl);
        
        // Get video details using our custom downloader
        const videoData = await downloader.getVideoDetails(videoUrl);
        
        if (videoData.success) {
            console.log('Successfully processed video:', videoData.title);
            console.log('Found download links:', videoData.downloadLinks.length);
            res.json(videoData);
        } else {
            console.log('Failed to process video:', videoData.error);
            res.status(400).json(videoData);
        }

    } catch (error) {
        console.error('Error in /api/video-details:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
});

// Proxy endpoint for downloading videos (to handle CORS)
app.get('/api/download-proxy', async (req, res) => {
    try {
        const { url, filename } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log('Proxying download for:', url);

        // Set up the request with proper headers
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Range': 'bytes=0-',
                'Referer': 'https://www.facebook.com/',
                'Origin': 'https://www.facebook.com'
            },
            timeout: 60000, // 60 seconds timeout
            maxRedirects: 5
        });

        // Set appropriate headers for download
        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'facebook_video.mp4'}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        if (response.headers['accept-ranges']) {
            res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
        }

        // Handle range requests
        if (req.headers.range && response.headers['content-range']) {
            res.setHeader('Content-Range', response.headers['content-range']);
            res.status(206);
        }

        // Pipe the video stream to response
        response.data.pipe(res);

        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Download stream error' });
            }
        });

    } catch (error) {
        console.error('Download proxy error:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Failed to download video. The link might be expired or invalid.' 
            });
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Facebook Video Downloader',
        version: '2.0.0',
        features: ['Real Facebook Video Extraction', 'Multiple Quality Options', 'Direct Download']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Something went wrong!' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Facebook Video Downloader server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to view the application`);
    console.log(`🔧 Using advanced Node.js-based video extraction`);
    console.log(`✨ Features: Real Facebook video downloads, Multiple qualities, No external APIs`);
});

module.exports = app;