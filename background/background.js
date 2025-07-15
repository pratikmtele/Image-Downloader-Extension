class ImageDownloaderBackground {
    constructor() {
        this.init();
    }

    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'downloadImages') {
                this.handleDownloadImages(request.images)
                    .then(() => sendResponse({ success: true }))
                    .catch(error => {
                        console.error('Download error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            } else if (request.action === 'ping') {
                sendResponse({ success: true, message: 'Extension is working' });
                return true;
            }
        });

        chrome.runtime.onInstalled.addListener((details) => {
            console.log('Extension installed/updated:', details.reason);
            this.createContextMenu();
        });

        chrome.runtime.onStartup.addListener(() => {
            console.log('Extension startup, creating context menu');
            this.createContextMenu();
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'downloadImage') {
                this.downloadImageFromContextMenu(info, tab);
            }
        });

        this.createContextMenu();
    }

    createContextMenu() {
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'downloadImage',
                title: 'Download with Image Downloader',
                contexts: ['image'],
                documentUrlPatterns: ['http://*/*', 'https://*/*']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Context menu creation error:', chrome.runtime.lastError);
                } else {
                    console.log('Context menu created successfully');
                }
            });
        });
    }

    async downloadImageFromContextMenu(info, tab) {
        try {
            this.sendStatusToPopup('downloading', 'Starting download', info.srcUrl);
            
            const imageData = {
                src: info.srcUrl,
                width: 0,
                height: 0,
                alt: 'Context Menu Image',
                title: 'Downloaded via context menu'
            };

            await this.handleDownloadImages([imageData]);
            
            this.sendStatusToPopup('success', 'Download completed', info.srcUrl);
            
            this.storeRecentDownload(info.srcUrl);
            
        } catch (error) {
            console.error('Context menu download error:', error);
            this.sendStatusToPopup('error', 'Download failed', info.srcUrl);
        }
    }

    sendStatusToPopup(status, message, url) {
        try {
            chrome.runtime.sendMessage({
                action: 'downloadStatus',
                status: status,
                message: message,
                url: url
            });
        } catch (error) {
        }
    }

    async storeRecentDownload(url) {
        try {
            const result = await chrome.storage.local.get(['recentDownloads']);
            const recentDownloads = result.recentDownloads || [];
            
            const filename = this.generateFilename(url, 1);
            const download = {
                url: url,
                filename: filename,
                timestamp: Date.now()
            };
            
            recentDownloads.unshift(download);
            const trimmedDownloads = recentDownloads.slice(0, 10);
            
            await chrome.storage.local.set({ recentDownloads: trimmedDownloads });
        } catch (error) {
            console.error('Error storing recent download:', error);
        }
    }

    async handleDownloadImages(images) {
        if (!images || images.length === 0) {
            throw new Error('No images provided');
        }

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            try {
                await this.downloadImage(image, i + 1, images.length);
            } catch (error) {
                console.error(`Error downloading image ${i + 1}:`, error);
            }
        }
    }

    async downloadImage(image, index, total) {
        try {
            const cleanedUrl = this.cleanImageUrl(image.src);
            const filename = this.generateFilename(cleanedUrl, index);
            
            const downloadId = await chrome.downloads.download({
                url: cleanedUrl,
                filename: `Image_Downloader/${filename}`,
                saveAs: false
            });

            await this.storeRecentDownload(cleanedUrl);
            return downloadId;

        } catch (error) {
            throw error;
        }
    }

    cleanImageUrl(url) {
        try {
            const urlObj = new URL(url);
            
            const pathname = urlObj.pathname;
            const imageExtensionMatch = pathname.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
            
            if (imageExtensionMatch) {
                const baseUrl = urlObj.origin + pathname;
                return baseUrl;
            } else {
                const params = new URLSearchParams(urlObj.search);
                
                const paramsToRemove = [
                    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                    'fbclid', 'gclid', 'msclkid', 'ref', 'referrer', 'source',
                    '_ga', '_gl', 'mc_cid', 'mc_eid', 'yclid', 'igshid',
                    
                    'share', 'shared', 'sharesource', 'sharevia',
                    
                    'auto', 'format', 'fit', 'w', 'h', 'dpr', 'q',
                    
                    'v', 'version', 'cache', 'cb', 't'
                ];
                
                paramsToRemove.forEach(param => params.delete(param));
                
                const cleanedSearch = params.toString();
                return urlObj.origin + urlObj.pathname + (cleanedSearch ? '?' + cleanedSearch : '');
            }
        } catch (error) {
            console.warn('Error cleaning URL, using original:', error);
            return url;
        }
    }

    generateFilename(url, index) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const originalName = pathname.split('/').pop();
            
            const extension = this.getFileExtension(originalName) || 'jpg';
            
            let basename = originalName.replace(/\.[^/.]+$/, '') || 'image';
            basename = basename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
            
            const timestamp = Date.now();
            return `${basename}_${index}_${timestamp}.${extension}`;

        } catch (error) {
            console.error('Error generating filename:', error);
            return `image_${index}_${Date.now()}.jpg`;
        }
    }

    getFileExtension(filename) {
        if (!filename) return null;
        
        const match = filename.match(/\.([^.]+)$/);
        if (match) {
            const ext = match[1].toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
                return ext;
            }
        }
        return null;
    }
}

new ImageDownloaderBackground();
