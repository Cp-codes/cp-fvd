// Facebook Video Downloader - Frontend JavaScript

// Constants for timeout values
const TIMEOUTS = {
    PASTE_VALIDATION: 100,
    ERROR_AUTO_HIDE: 8000,
    SUCCESS_MESSAGE: 4000,
    DOWNLOAD_DELAY: 1000
};

class FacebookVideoDownloader {
    constructor() {
        this.videoUrlInput = null;
        this.downloadBtn = null;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupSmoothScrolling();
        this.setupAdditionalFeatures();
    }

    cacheElements() {
        // Cache frequently used DOM elements
        this.videoUrlInput = document.getElementById('videoUrl');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.videoPreview = document.getElementById('videoPreview');
    }

    bindEvents() {
        if (!this.downloadBtn || !this.videoUrlInput) {
            console.error('Required DOM elements not found');
            return;
        }

        // Download button click event
        this.downloadBtn.addEventListener('click', () => this.handleDownload());

        // Enter key press on input
        this.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleDownload();
            }
        });

        // Input validation on paste/input
        this.videoUrlInput.addEventListener('input', () => this.validateUrl());
        this.videoUrlInput.addEventListener('paste', () => {
            setTimeout(() => this.validateUrl(), TIMEOUTS.PASTE_VALIDATION);
        });
    }

    setupSmoothScrolling() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    validateUrl() {
        if (!this.videoUrlInput) return false;
        
        const url = this.videoUrlInput.value.trim();
        
        if (url && !this.isValidFacebookUrl(url)) {
            this.showError('Please enter a valid Facebook video URL');
            return false;
        } else {
            this.hideError();
            return true;
        }
    }

    isValidFacebookUrl(url) {
        const facebookUrlPattern = /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.watch)/i;
        return facebookUrlPattern.test(url);
    }

    async handleDownload() {
        if (!this.videoUrlInput) {
            this.showError('Input element not found');
            return;
        }

        const url = this.videoUrlInput.value.trim();

        if (!url) {
            this.showError('Please enter a Facebook video URL');
            return;
        }

        if (!this.isValidFacebookUrl(url)) {
            this.showError('Please enter a valid Facebook video URL');
            return;
        }

        this.setLoadingState(true);
        this.hideError();
        this.hideVideoPreview();

        try {
            const response = await fetch('/api/video-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl: url })
            });

            const data = await response.json();

            if (data.success) {
                this.displayVideoPreview(data);
            } else {
                this.showError(data.error || 'Failed to fetch video details');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const btnText = document.getElementById('btnText');
        const btnLoading = document.getElementById('btnLoading');

        if (!btnText || !btnLoading || !this.downloadBtn) return;

        if (loading) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            this.downloadBtn.disabled = true;
            this.downloadBtn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            this.downloadBtn.disabled = false;
            this.downloadBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }

    showError(message) {
        if (!this.errorMessage || !this.errorText) return;
        
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide error after specified timeout
        setTimeout(() => {
            this.hideError();
        }, TIMEOUTS.ERROR_AUTO_HIDE);
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.classList.add('hidden');
        }
    }

    displayVideoPreview(videoData) {
        const videoThumbnail = document.getElementById('videoThumbnail');
        const videoTitle = document.getElementById('videoTitle');
        const videoDuration = document.getElementById('videoDuration');
        const downloadOptions = document.getElementById('downloadOptions');

        if (!this.videoPreview || !videoThumbnail || !videoTitle || !videoDuration || !downloadOptions) {
            console.error('Required preview elements not found');
            return;
        }

        // Set video details
        videoTitle.textContent = videoData.title || 'Facebook Video';
        videoDuration.textContent = videoData.duration ? `Duration: ${videoData.duration}` : '';
        
        // Set thumbnail with fallback
        if (videoData.thumbnail) {
            videoThumbnail.src = videoData.thumbnail;
            videoThumbnail.onerror = () => {
                videoThumbnail.src = this.generatePlaceholderThumbnail();
            };
        } else {
            videoThumbnail.src = this.generatePlaceholderThumbnail();
        }

        // Clear previous download options
        downloadOptions.innerHTML = '';

        // Show success message
        if (videoData.downloadLinks && videoData.downloadLinks.length > 0) {
            const successDiv = this.createMessageDiv(
                'success',
                'mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg',
                'fas fa-check-circle',
                `Video found! ${videoData.downloadLinks.length} quality option(s) available for download.`
            );
            downloadOptions.appendChild(successDiv);
        }

        // Create download buttons
        if (videoData.downloadLinks && videoData.downloadLinks.length > 0) {
            videoData.downloadLinks.forEach((link, index) => {
                const button = this.createDownloadButton(link, index);
                downloadOptions.appendChild(button);
            });
        } else {
            // Show error if no download links found
            const errorDiv = this.createMessageDiv(
                'error',
                'mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg',
                'fas fa-exclamation-triangle',
                'No download links found. The video might be private or require login.'
            );
            downloadOptions.appendChild(errorDiv);
        }

        // Show video preview with animation
        this.videoPreview.classList.remove('hidden');
        this.videoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    createMessageDiv(type, className, iconClass, message) {
        const div = document.createElement('div');
        div.className = className;
        div.innerHTML = `
            <div class="flex items-center">
                <i class="${iconClass} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        return div;
    }

    createDownloadButton(link, index) {
        const button = document.createElement('button');
        button.className = 'w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-2';
        
        const quality = link.quality || `Quality ${index + 1}`;
        const format = link.format || 'MP4';
        const size = link.size || '';
        
        button.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-download mr-2"></i>
                    <span>${quality} - ${format}</span>
                </div>
                <div class="text-sm opacity-75">
                    ${size}
                </div>
            </div>
        `;

        button.addEventListener('click', () => {
            if (link.url) {
                this.downloadVideo(link.url, `facebook_video_${quality.replace(/[^a-zA-Z0-9]/g, '_')}.${format.toLowerCase()}`);
            } else {
                this.showError('Download link not available for this quality');
            }
        });

        return button;
    }

    downloadVideo(url, filename) {
        try {
            console.log('Starting download:', filename);
            
            // Show download starting message
            this.showSuccessMessage('Download starting... Please wait.');

            // Use proxy for Facebook videos to handle CORS and authentication
            const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
            
            // Create download link
            const link = document.createElement('a');
            link.href = proxyUrl;
            link.download = filename;
            link.target = '_blank';
            
            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message after a delay
            setTimeout(() => {
                this.showSuccessMessage('Download initiated! Check your downloads folder.');
            }, TIMEOUTS.DOWNLOAD_DELAY);

        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to start download. Please try again.');
        }
    }

    showSuccessMessage(message) {
        // Remove any existing success messages
        this.clearExistingMessages();

        // Create success message element
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Auto-remove after specified timeout
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, TIMEOUTS.SUCCESS_MESSAGE);
    }

    clearExistingMessages() {
        const existingMessages = document.querySelectorAll('.success-message');
        existingMessages.forEach(msg => msg.remove());
    }

    hideVideoPreview() {
        if (this.videoPreview) {
            this.videoPreview.classList.add('hidden');
        }
    }

    generatePlaceholderThumbnail() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDQwMCAyMjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjI1IiBmaWxsPSIjMTg3N0YyIi8+CjxwYXRoIGQ9Ik0xNzUgMTAwTDIyNSAxMjVMMTc1IDE1MFYxMDBaIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIyMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+RmFjZWJvb2sgVmlkZW88L3RleHQ+Cjwvc3ZnPgo=';
    }

    setupAdditionalFeatures() {
        this.setupDownloadButtonAnimation();
        this.setupUrlInputFeatures();
        this.setupKeyboardShortcuts();
        this.setupScrollAnimations();
        this.setupPlaceholder();
    }

    setupDownloadButtonAnimation() {
        if (!this.downloadBtn) return;

        this.downloadBtn.addEventListener('mouseenter', () => {
            this.downloadBtn.classList.add('pulse-animation');
        });
        this.downloadBtn.addEventListener('mouseleave', () => {
            this.downloadBtn.classList.remove('pulse-animation');
        });
    }

    setupUrlInputFeatures() {
        if (!this.videoUrlInput) return;

        // Add copy URL functionality (right-click context menu alternative)
        this.videoUrlInput.addEventListener('focus', () => {
            this.videoUrlInput.select();
        });

        // Set placeholder text
        this.videoUrlInput.placeholder = 'Paste Facebook video URL here... (e.g., https://www.facebook.com/watch/?v=123456789)';
    }

    setupKeyboardShortcuts() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to download
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.downloadBtn) {
                    this.downloadBtn.click();
                }
            }
            
            // Escape to clear input and hide preview
            if (e.key === 'Escape') {
                if (this.videoUrlInput) {
                    this.videoUrlInput.value = '';
                }
                this.hideVideoPreview();
                this.hideError();
            }
        });
    }

    setupScrollAnimations() {
        // Add loading animation to page elements
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.glass-effect').forEach(el => {
            observer.observe(el);
        });
    }

    setupPlaceholder() {
        // This method can be extended for additional setup
        console.log('Facebook Video Downloader initialized successfully');
    }

    // Utility method to format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Utility method to format duration
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new FacebookVideoDownloader();
    } catch (error) {
        console.error('Failed to initialize Facebook Video Downloader:', error);
    }
});