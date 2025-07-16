class ImageDownloaderPopup {
    constructor() {
        this.init();
    }

    init() {
        this.updateStatus();
        this.bindEvents();
        this.loadRecentDownloads();
    }

    bindEvents() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'downloadStatus') {
                this.updateDownloadStatus(request.status, request.message, request.url);
            }
        });
    }

    updateStatus() {
        const statusArea = document.getElementById('statusArea');
        if (statusArea) {
            statusArea.innerHTML = '<div class="status-text">Ready to download images</div>';
            statusArea.className = 'status';
        }
    }

    updateDownloadStatus(status, message, url = '') {
        const statusArea = document.getElementById('statusArea');
        if (!statusArea) return;
        
        statusArea.className = `status ${status}`;
        
        let statusText = message;
        if (url) {
            const shortUrl = this.truncateUrl(url, 30);
            statusText = `${message}: ${shortUrl}`;
        }
        
        statusArea.innerHTML = `<div class="status-text">${statusText}</div>`;
        
        if (status === 'success' || status === 'error') {
            setTimeout(() => {
                this.updateStatus();
            }, 3000);
        }
    }

    truncateUrl(url, maxLength = 30) {
        if (url.length <= maxLength) return url;
        const start = url.substring(0, 12);
        const end = url.substring(url.length - 12);
        return `${start}...${end}`;
    }

    async loadRecentDownloads() {
        try {
            const result = await chrome.storage.local.get(['recentDownloads']);
            const recentDownloads = result.recentDownloads || [];
            
            const existingSection = document.querySelector('.recent-downloads');
            if (existingSection) {
                existingSection.remove();
            }
            
            if (recentDownloads.length > 0) {
                this.displayRecentDownloads(recentDownloads.slice(0, 3));
            }
        } catch (error) {
            console.error('Error loading recent downloads:', error);
        }
    }

    displayRecentDownloads(downloads) {
        const container = document.querySelector('.container');
        const recentSection = document.createElement('div');
        recentSection.className = 'recent-downloads';
        recentSection.innerHTML = `
            <h3>Recent Downloads</h3>
            ${downloads.map(download => `
                <div class="recent-item">
                    <div class="recent-filename">${download.filename}</div>
                    <div class="recent-time">${this.formatTime(download.timestamp)}</div>
                </div>
            `).join('')}
        `;
        container.appendChild(recentSection);
    }

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageDownloaderPopup();
});
