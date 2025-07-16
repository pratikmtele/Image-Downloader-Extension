class ImageDownloaderBackground {
  constructor() {
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "downloadImages") {
        this.handleDownloadImages(request.images)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true;
      } else if (request.action === "ping") {
        sendResponse({ success: true, message: "Extension is working" });
        return true;
      } else {
        sendResponse({ success: false, error: "Unknown action" });
        return true;
      }
    });

    chrome.runtime.onInstalled.addListener((details) => {
      this.createContextMenu();
    });

    chrome.runtime.onStartup.addListener(() => {
      this.createContextMenu();
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "downloadImage") {
        this.downloadImageFromContextMenu(info, tab);
      }
    });

    this.createContextMenu();
  }

  createContextMenu() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create(
        {
          id: "downloadImage",
          title: "Download with Image Downloader",
          contexts: ["image"],
          documentUrlPatterns: ["http://*/*", "https://*/*"],
        },
        () => {
          if (chrome.runtime.lastError) {
          }
        }
      );
    });
  }

  async downloadImageFromContextMenu(info, tab) {
    try {
      this.sendStatusToPopup("downloading", "Starting download", info.srcUrl);

      const imageData = {
        src: info.srcUrl,
        width: 0,
        height: 0,
        alt: "Context Menu Image",
        title: "Downloaded via context menu",
      };

      await this.handleDownloadImages([imageData]);

      this.sendStatusToPopup("success", "Download completed", info.srcUrl);

      this.storeRecentDownload(info.srcUrl);
    } catch (error) {
      this.sendStatusToPopup("error", "Download failed", info.srcUrl);
    }
  }

  sendStatusToPopup(status, message, url) {
    try {
      chrome.runtime.sendMessage(
        {
          action: "downloadStatus",
          status: status,
          message: message,
          url: url,
        },
        (response) => {}
      );
    } catch (error) {}
  }

  async storeRecentDownload(url) {
    try {
      const result = await chrome.storage.local.get(["recentDownloads"]);
      const recentDownloads = result.recentDownloads || [];

      const filename = this.generateFilename(url, 1);
      const download = {
        url: url,
        filename: filename,
        timestamp: Date.now(),
      };

      recentDownloads.unshift(download);
      const trimmedDownloads = recentDownloads.slice(0, 10);

      await chrome.storage.local.set({ recentDownloads: trimmedDownloads });
    } catch (error) {}
  }

  async handleDownloadImages(images) {
    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        await this.downloadImage(image, i + 1, images.length);
      } catch (error) {
        this.sendStatusToPopup(
          "error",
          `Download failed for image ${i + 1}`,
          image.src
        );
        throw error;
      }
    }
  }

  async downloadImage(image, index, total) {
    try {
      const cleanedUrl = this.cleanImageUrl(image.src);
      const filename = this.generateFilename(cleanedUrl, index);

      let downloadId;

      if (cleanedUrl.startsWith("data:image/")) {
        try {
          downloadId = await this.downloadDataImageDirect(cleanedUrl, filename);
        } catch (conversionError) {
          throw new Error(
            `Failed to download data image: ${conversionError.message}`
          );
        }
      } else {
        downloadId = await chrome.downloads.download({
          url: cleanedUrl,
          filename: `Image_Downloader/${filename}`,
          saveAs: false,
        });
      }

      await this.storeRecentDownload(cleanedUrl);

      return downloadId;
    } catch (error) {
      throw error;
    }
  }

  async convertDataUrlToBlob(dataUrl) {
    try {
      const mimeType = this.getMimeTypeFromDataUrl(dataUrl);
      if (!mimeType) throw new Error("Could not extract MIME type");

      if (dataUrl.includes("base64,")) {
        const base64Index = dataUrl.indexOf("base64,");
        const base64Data = dataUrl.substring(base64Index + 7);
        if (!base64Data) throw new Error("Could not extract base64 data");

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType });
      } else {
        const dataIndex = dataUrl.indexOf(",");
        if (dataIndex === -1) throw new Error("Invalid data URL format");
        const encodedData = dataUrl.substring(dataIndex + 1);
        const decodedData = decodeURIComponent(encodedData);
        return new Blob([decodedData], { type: mimeType });
      }
    } catch (error) {
      throw new Error(`Data URL conversion failed: ${error.message}`);
    }
  }

  cleanImageUrl(url) {
    try {
      if (url.startsWith("data:image/")) {
        return url;
      }

      const urlObj = new URL(url);

      const pathname = urlObj.pathname;
      const imageExtensionMatch = pathname.match(
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
      );

      if (imageExtensionMatch) {
        const baseUrl = urlObj.origin + pathname;
        return baseUrl;
      } else {
        const params = new URLSearchParams(urlObj.search);

        const paramsToRemove = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content",
          "fbclid",
          "gclid",
          "msclkid",
          "ref",
          "referrer",
          "source",
          "_ga",
          "_gl",
          "mc_cid",
          "mc_eid",
          "yclid",
          "igshid",

          "share",
          "shared",
          "sharesource",
          "sharevia",

          "auto",
          "format",
          "fit",
          "w",
          "h",
          "dpr",
          "q",

          "v",
          "version",
          "cache",
          "cb",
          "t",
        ];

        paramsToRemove.forEach((param) => params.delete(param));

        const cleanedSearch = params.toString();
        return (
          urlObj.origin +
          urlObj.pathname +
          (cleanedSearch ? "?" + cleanedSearch : "")
        );
      }
    } catch (error) {
      return url;
    }
  }

  generateFilename(url, index) {
    try {
      if (url.startsWith("data:image/")) {
        const mimeMatch = url.match(/data:image\/([^;,]+)/);
        const extension = mimeMatch ? mimeMatch[1] : "png";
        const extensionMap = { jpeg: "jpg", "svg+xml": "svg" };
        const finalExtension = extensionMap[extension] || extension;
        const timestamp = Date.now();
        const prefix = url.includes("base64,") ? "base64" : "data";
        return `${prefix}_image_${index}_${timestamp}.${finalExtension}`;
      }

      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const originalName = pathname.split("/").pop();
      const extension = this.getFileExtension(originalName) || "jpg";
      let basename = originalName.replace(/\.[^/.]+$/, "") || "image";
      basename = basename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);
      const timestamp = Date.now();
      return `${basename}_${index}_${timestamp}.${extension}`;
    } catch (error) {
      return `image_${index}_${Date.now()}.jpg`;
    }
  }

  getFileExtension(filename) {
    if (!filename) return null;

    const match = filename.match(/\.([^.]+)$/);
    if (match) {
      const ext = match[1].toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) {
        return ext;
      }
    }
    return null;
  }

  getMimeTypeFromDataUrl(dataUrl) {
    if (!dataUrl.startsWith("data:image/")) return null;
    const mimeMatch = dataUrl.match(/data:image\/([^;,]+)/);
    return mimeMatch ? `image/${mimeMatch[1]}` : null;
  }

  async downloadDataImageDirect(dataUrl, filename) {
    try {
      return await chrome.downloads.download({
        url: dataUrl,
        filename: `Image_Downloader/${filename}`,
        saveAs: false,
      });
    } catch (directError) {
      const blob = await this.convertDataUrlToBlob(dataUrl);
      const blobUrl = URL.createObjectURL(blob);

      const downloadId = await chrome.downloads.download({
        url: blobUrl,
        filename: `Image_Downloader/${filename}`,
        saveAs: false,
      });

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return downloadId;
    }
  }
}

const backgroundInstance = new ImageDownloaderBackground();

self.addEventListener("unhandledrejection", (event) => {});
