class ImageDownloaderContent {
    constructor() {
        this.init();
    }

    init() {
        if (this.isExtensionContextValid()) {
            this.setupImageDragDetection();
        }
    }

    isExtensionContextValid() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            return false;
        }
    }

    setupImageDragDetection() {
        this.addDragListenersToImages();
        
        const observer = new MutationObserver((mutations) => {
            if (!this.isExtensionContextValid()) {
                observer.disconnect();
                return;
            }
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG') {
                            this.addDragListenerToImage(node);
                        } else {
                            const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
                            images.forEach(img => this.addDragListenerToImage(img));
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    addDragListenersToImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => this.addDragListenerToImage(img));
    }

    addDragListenerToImage(img) {
        if (img.hasAttribute('data-downloader-listener')) {
            return;
        }
        
        img.setAttribute('data-downloader-listener', 'true');
        
        img.addEventListener('dragstart', (e) => {
            if (!this.isExtensionContextValid()) {
                return;
            }
            
            const imageData = {
                src: img.src,
                alt: img.alt || '',
                title: img.title || '',
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
            };
            
            e.dataTransfer.setData('text/html', `<img src="${img.src}" alt="${img.alt}" title="${img.title}">`);
            e.dataTransfer.setData('text/uri-list', img.src);
            e.dataTransfer.setData('text/plain', img.src);
            
            this.showFloatingDropZone(imageData);
            
            img.style.opacity = '0.7';
            img.style.transform = 'scale(0.95)';
        });
        
        img.addEventListener('dragend', (e) => {
            img.style.opacity = '';
            img.style.transform = '';
            
            setTimeout(() => {
                this.hideFloatingDropZone();
            }, 500);
        });
    }

    showFloatingDropZone(imageData) {
        this.hideFloatingDropZone();
        
        const dropZone = document.createElement('div');
        dropZone.id = 'image-downloader-floating-drop';
        dropZone.innerHTML = `
            <div class="floating-drop-content">
                <div class="drop-icon">📁</div>
                <div class="drop-text">Drop to Download</div>
                <div class="drop-subtext">Release to save image</div>
            </div>
        `;
        
        const styles = `
            #image-downloader-floating-drop {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 250px !important;
                height: 150px !important;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
                border: 3px dashed white !important;
                border-radius: 15px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 2147483647 !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
                animation: floatingDropZoneShow 0.3s ease-out !important;
                backdrop-filter: blur(10px) !important;
                color: white !important;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                font-size: 14px !important;
                text-align: center !important;
                pointer-events: auto !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            @keyframes floatingDropZoneShow {
                0% {
                    opacity: 0 !important;
                    transform: translate(-50%, -50%) scale(0.7) !important;
                }
                100% {
                    opacity: 1 !important;
                    transform: translate(-50%, -50%) scale(1) !important;
                }
            }
            
            #image-downloader-floating-drop .floating-drop-content {
                text-align: center !important;
                pointer-events: none !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            #image-downloader-floating-drop .drop-icon {
                font-size: 24px !important;
                margin-bottom: 5px !important;
                display: block !important;
            }
            
            #image-downloader-floating-drop .drop-text {
                font-size: 14px !important;
                font-weight: 600 !important;
                margin-bottom: 2px !important;
                display: block !important;
                color: white !important;
            }
            
            #image-downloader-floating-drop .drop-subtext {
                font-size: 11px !important;
                opacity: 0.9 !important;
                display: block !important;
                color: white !important;
            }
            
            #image-downloader-floating-drop.drag-over {
                background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%) !important;
                border-color: white !important;
                transform: translate(-50%, -50%) scale(1.1) !important;
                animation: imageDownloaderPulse 0.5s infinite alternate !important;
            }
            
            @keyframes imageDownloaderPulse {
                from { box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }
                to { box-shadow: 0 12px 48px rgba(0,0,0,0.5) !important; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'image-downloader-floating-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        document.body.appendChild(dropZone);
        
        this.setupFloatingDropZoneEvents(dropZone, imageData);
        
        this.floatingDropZone = dropZone;
        this.floatingDropStyles = styleSheet;
    }

    setupFloatingDropZoneEvents(dropZone, imageData) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropZone.addEventListener('dragenter', () => {
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            dropZone.classList.remove('drag-over');
            
            if (!this.isExtensionContextValid()) {
                this.showErrorInDropZone(dropZone, 'Extension context lost - please reload page');
                return;
            }
            
            try {
                const content = dropZone.querySelector('.floating-drop-content');
                content.innerHTML = `
                    <div class="drop-icon">⏳</div>
                    <div class="drop-text">Downloading...</div>
                    <div class="drop-subtext">Please wait</div>
                `;
                
                await this.downloadFloatingImage(imageData);
                
                content.innerHTML = `
                    <div class="drop-icon">✅</div>
                    <div class="drop-text">Downloaded!</div>
                    <div class="drop-subtext">Image saved</div>
                `;
                
                setTimeout(() => {
                    this.hideFloatingDropZone();
                }, 1500);
                
            } catch (error) {
                this.showErrorInDropZone(dropZone, error.message);
            }
        });
    }

    showErrorInDropZone(dropZone, errorMessage) {
        const content = dropZone.querySelector('.floating-drop-content');
        content.innerHTML = `
            <div class="drop-icon">❌</div>
            <div class="drop-text">Error</div>
            <div class="drop-subtext">${errorMessage}</div>
        `;
        
        setTimeout(() => {
            this.hideFloatingDropZone();
        }, 3000);
    }

    async downloadFloatingImage(imageData) {
        return new Promise((resolve, reject) => {
            if (!this.isExtensionContextValid()) {
                reject(new Error('Extension context invalidated - please reload the page'));
                return;
            }
            
            // Add a timeout for the message
            const messageTimeout = setTimeout(() => {
                reject(new Error('Message timeout - background script not responding'));
            }, 5000);
            
            try {
                chrome.runtime.sendMessage({
                    action: 'downloadImages',
                    images: [imageData]
                }, (response) => {
                    clearTimeout(messageTimeout);
                    
                    // Check if the extension context was invalidated during the message
                    if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        if (error.includes('receiving end does not exist') || error.includes('Extension context invalidated')) {
                            reject(new Error('Extension context lost - please reload the extension and refresh this page'));
                        } else {
                            reject(new Error(`Runtime error: ${error}`));
                        }
                        return;
                    }
                    
                    if (!response) {
                        reject(new Error('No response from background script - extension may need to be reloaded'));
                        return;
                    }
                    
                    if (!response.success) {
                        reject(new Error(response.error || 'Download failed'));
                        return;
                    }
                    
                    resolve();
                });
            } catch (error) {
                clearTimeout(messageTimeout);
                reject(new Error(`Message sending failed: ${error.message}`));
            }
        });
    }

    hideFloatingDropZone() {
        if (this.floatingDropZone) {
            this.floatingDropZone.remove();
            this.floatingDropZone = null;
        }
        if (this.floatingDropStyles) {
            this.floatingDropStyles.remove();
            this.floatingDropStyles = null;
        }
    }
}

function initializeExtension() {
    try {
        if (chrome && chrome.runtime && chrome.runtime.id) {
            new ImageDownloaderContent();
        }
    } catch (error) {
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}