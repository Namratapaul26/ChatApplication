// UI helper functions and utilities
class UIHelpers {
  static formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  static formatFileSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
  }

  static getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const iconMap = {
      pdf: "fas fa-file-pdf",
      doc: "fas fa-file-word",
      docx: "fas fa-file-word",
      xls: "fas fa-file-excel",
      xlsx: "fas fa-file-excel",
      ppt: "fas fa-file-powerpoint",
      pptx: "fas fa-file-powerpoint",
      txt: "fas fa-file-alt",
      zip: "fas fa-file-archive",
      rar: "fas fa-file-archive",
      "7z": "fas fa-file-archive",
      mp3: "fas fa-file-audio",
      wav: "fas fa-file-audio",
      ogg: "fas fa-file-audio",
      mp4: "fas fa-file-video",
      avi: "fas fa-file-video",
      mov: "fas fa-file-video",
      jpg: "fas fa-file-image",
      jpeg: "fas fa-file-image",
      png: "fas fa-file-image",
      gif: "fas fa-file-image",
      svg: "fas fa-file-image",
    };

    return iconMap[ext] || "fas fa-file";
  }

  static createLoadingSpinner() {
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    spinner.innerHTML = '<div class="loading"></div>';
    return spinner;
  }

  static showToast(message, type = "info", duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll(".toast");
    existingToasts.forEach((toast) => toast.remove());

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon =
      {
        success: "fas fa-check-circle",
        error: "fas fa-exclamation-circle",
        warning: "fas fa-exclamation-triangle",
        info: "fas fa-info-circle",
      }[type] || "fas fa-info-circle";

    toast.innerHTML = `
            <div class="toast-content">
                <i class="${icon}"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    // Add styles if not already added
    if (!document.getElementById("toast-styles")) {
      const styles = document.createElement("style");
      styles.id = "toast-styles";
      styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                    animation: slideInRight 0.3s ease;
                }

                .toast-content {
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .toast-success .toast-content { border-left: 4px solid var(--success-color); }
                .toast-error .toast-content { border-left: 4px solid var(--error-color); }
                .toast-warning .toast-content { border-left: 4px solid var(--warning-color); }
                .toast-info .toast-content { border-left: 4px solid var(--info-color); }

                .toast-success i { color: var(--success-color); }
                .toast-error i { color: var(--error-color); }
                .toast-warning i { color: var(--warning-color); }
                .toast-info i { color: var(--info-color); }

                .toast-message {
                    flex: 1;
                    font-size: 14px;
                    color: var(--text-primary);
                    line-height: 1.4;
                }

                .toast-close {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 0;
                    font-size: 12px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }

                .toast-close:hover {
                    background: var(--bg-secondary);
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
      document.head.appendChild(styles);
    }

    // Add to document
    document.body.appendChild(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.animation = "slideOutRight 0.3s ease";
          setTimeout(() => {
            if (toast.parentElement) {
              toast.remove();
            }
          }, 300);
        }
      }, duration);
    }

    return toast;
  }

  static createConfirmDialog(title, message, onConfirm, onCancel = null) {
    // Remove existing dialogs
    const existingDialogs = document.querySelectorAll(".confirm-dialog");
    existingDialogs.forEach((dialog) => dialog.remove());

    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
            <div class="confirm-dialog-overlay">
                <div class="confirm-dialog-content">
                    <div class="confirm-dialog-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="confirm-dialog-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirm-dialog-actions">
                        <button class="btn-secondary confirm-cancel">Cancel</button>
                        <button class="btn-primary confirm-ok">Confirm</button>
                    </div>
                </div>
            </div>
        `;

    // Add styles if not already added
    if (!document.getElementById("confirm-dialog-styles")) {
      const styles = document.createElement("style");
      styles.id = "confirm-dialog-styles";
      styles.textContent = `
                .confirm-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10001;
                }

                .confirm-dialog-overlay {
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .confirm-dialog-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    max-width: 400px;
                    width: 90%;
                    animation: scaleIn 0.2s ease;
                }

                .confirm-dialog-header {
                    padding: 20px 20px 0;
                }

                .confirm-dialog-header h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .confirm-dialog-body {
                    padding: 15px 20px;
                }

                .confirm-dialog-body p {
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin: 0;
                }

                .confirm-dialog-actions {
                    padding: 0 20px 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `;
      document.head.appendChild(styles);
    }

    // Event listeners
    const cancelBtn = dialog.querySelector(".confirm-cancel");
    const okBtn = dialog.querySelector(".confirm-ok");

    const cleanup = () => {
      dialog.style.animation = "scaleOut 0.2s ease";
      setTimeout(() => {
        if (dialog.parentElement) {
          dialog.remove();
        }
      }, 200);
    };

    cancelBtn.onclick = () => {
      cleanup();
      if (onCancel) onCancel();
    };

    okBtn.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    // Close on overlay click
    dialog.querySelector(".confirm-dialog-overlay").onclick = (e) => {
      if (e.target === e.currentTarget) {
        cleanup();
        if (onCancel) onCancel();
      }
    };

    document.body.appendChild(dialog);
    return dialog;
  }

  static createImagePreview(src, alt = "Image") {
    const preview = document.createElement("div");
    preview.className = "image-preview-modal";
    preview.innerHTML = `
            <div class="image-preview-overlay">
                <div class="image-preview-content">
                    <button class="image-preview-close">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${src}" alt="${alt}">
                    <div class="image-preview-actions">
                        <a href="${src}" download class="btn-download">
                            <i class="fas fa-download"></i>
                            Download
                        </a>
                    </div>
                </div>
            </div>
        `;

    // Add styles if not already added
    if (!document.getElementById("image-preview-styles")) {
      const styles = document.createElement("style");
      styles.id = "image-preview-styles";
      styles.textContent = `
                .image-preview-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10002;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .image-preview-content {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .image-preview-content img {
                    max-width: 100%;
                    max-height: 80vh;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }

                .image-preview-close {
                    position: absolute;
                    top: -50px;
                    right: 0;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.2s;
                }

                .image-preview-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .image-preview-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 15px;
                }

                .btn-download {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .btn-download:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `;
      document.head.appendChild(styles);
    }

    // Event listeners
    const closeBtn = preview.querySelector(".image-preview-close");
    closeBtn.onclick = () => preview.remove();

    preview.onclick = (e) => {
      if (e.target === preview) {
        preview.remove();
      }
    };

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === "Escape") {
        preview.remove();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);

    document.body.appendChild(preview);
    return preview;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      return new Promise((resolve, reject) => {
        if (document.execCommand("copy")) {
          resolve();
        } else {
          reject(new Error("Copy command failed"));
        }
        document.body.removeChild(textArea);
      });
    }
  }

  static isImageFile(file) {
    return file.type.startsWith("image/");
  }

  static isVideoFile(file) {
    return file.type.startsWith("video/");
  }

  static isAudioFile(file) {
    return file.type.startsWith("audio/");
  }

  static validateFileSize(file, maxSizeMB = 10) {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    return file.size <= maxSize;
  }

  static validateFileType(file, allowedTypes = []) {
    if (allowedTypes.length === 0) return true;
    return allowedTypes.some((type) => file.type.startsWith(type));
  }

  static createProgressBar() {
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.innerHTML = `
            <div class="progress-track">
                <div class="progress-fill"></div>
            </div>
            <span class="progress-text">0%</span>
        `;

    // Add styles if not already added
    if (!document.getElementById("progress-bar-styles")) {
      const styles = document.createElement("style");
      styles.id = "progress-bar-styles";
      styles.textContent = `
                .progress-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 0;
                }

                .progress-track {
                    flex: 1;
                    height: 4px;
                    background: var(--bg-tertiary);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 2px;
                    transition: width 0.2s ease;
                    width: 0%;
                }

                .progress-text {
                    font-size: 12px;
                    color: var(--text-secondary);
                    min-width: 35px;
                    text-align: right;
                }
            `;
      document.head.appendChild(styles);
    }

    progressBar.updateProgress = (percent) => {
      const fill = progressBar.querySelector(".progress-fill");
      const text = progressBar.querySelector(".progress-text");

      fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      text.textContent = `${Math.round(percent)}%`;
    };

    return progressBar;
  }

  static animateCSS(element, animationName, duration = "1s") {
    return new Promise((resolve) => {
      const animationEnd = (event) => {
        event.stopPropagation();
        element.classList.remove(`animate__${animationName}`);
        element.removeEventListener("animationend", animationEnd);
        resolve("Animation ended");
      };

      element.style.setProperty("--animate-duration", duration);
      element.classList.add(`animate__animated`, `animate__${animationName}`);
      element.addEventListener("animationend", animationEnd);
    });
  }

  static scrollToBottom(element, smooth = true) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  static isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  static createRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
        `;

    // Add ripple keyframes if not already added
    if (!document.getElementById("ripple-styles")) {
      const styles = document.createElement("style");
      styles.id = "ripple-styles";
      styles.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
      document.head.appendChild(styles);
    }

    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = UIHelpers;
} else {
  window.UIHelpers = UIHelpers;
}
