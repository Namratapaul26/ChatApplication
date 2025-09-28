// Media handling functionality - file uploads, voice recording, etc.
class MediaHandler {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingStream = null;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;

    this.initializeMediaHandler();
  }

  initializeMediaHandler() {
    this.setupVoiceRecording();
    this.setupFileUpload();
    this.setupDragAndDrop();
    this.setupMediaPreview();
  }

  setupVoiceRecording() {
    const voiceBtn = document.getElementById("voice-btn");
    if (!voiceBtn) return;

    voiceBtn.addEventListener("click", () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });
  }

  async startRecording() {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      this.recordingStream = stream;
      this.audioChunks = [];

      // Create MediaRecorder
      const options = {
        mimeType: "audio/webm;codecs=opus",
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = "audio/mp4";
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingComplete();
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // Update UI
      this.showRecordingUI();
      this.startRecordingTimer();

      UIHelpers.showToast("Recording started", "info");
    } catch (error) {
      console.error("Failed to start recording:", error);
      UIHelpers.showToast("Failed to access microphone", "error");

      if (error.name === "NotAllowedError") {
        UIHelpers.showToast(
          "Microphone permission denied. Please allow access and try again.",
          "error",
          5000
        );
      }
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.stop();
    this.isRecording = false;

    // Stop all tracks
    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach((track) => track.stop());
      this.recordingStream = null;
    }

    // Update UI
    this.hideRecordingUI();
    this.stopRecordingTimer();
  }

  handleRecordingComplete() {
    const audioBlob = new Blob(this.audioChunks, {
      type: this.mediaRecorder.mimeType || "audio/webm",
    });

    const duration = Date.now() - this.recordingStartTime;

    // Check minimum duration (1 second)
    if (duration < 1000) {
      UIHelpers.showToast(
        "Recording too short. Minimum 1 second required.",
        "warning"
      );
      return;
    }

    // Create audio file
    const timestamp = new Date().getTime();
    const filename = `voice_${timestamp}.webm`;
    const file = new File([audioBlob], filename, {
      type: audioBlob.type,
    });

    // Show audio preview
    this.showAudioPreview(file, audioBlob);
  }

  showAudioPreview(file, audioBlob) {
    const preview = document.createElement("div");
    preview.className = "audio-preview-modal";

    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = this.formatDuration(
      (Date.now() - this.recordingStartTime) / 1000
    );

    preview.innerHTML = `
            <div class="audio-preview-overlay">
                <div class="audio-preview-content">
                    <div class="audio-preview-header">
                        <h3>Voice Message</h3>
                        <button class="btn-close audio-preview-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="audio-preview-body">
                        <div class="audio-player">
                            <button class="audio-play-btn" id="preview-play-btn">
                                <i class="fas fa-play"></i>
                            </button>
                            <div class="audio-info">
                                <span class="audio-duration">${duration}</span>
                                <span class="audio-size">${UIHelpers.formatFileSize(
                                  file.size
                                )}</span>
                            </div>
                        </div>
                        <audio id="preview-audio" preload="metadata" style="display: none;">
                            <source src="${audioUrl}" type="${audioBlob.type}">
                        </audio>
                    </div>
                    <div class="audio-preview-actions">
                        <button class="btn-secondary audio-discard">Discard</button>
                        <button class="btn-primary audio-send">Send</button>
                    </div>
                </div>
            </div>
        `;

    // Add styles if not already added
    if (!document.getElementById("audio-preview-styles")) {
      const styles = document.createElement("style");
      styles.id = "audio-preview-styles";
      styles.textContent = `
                .audio-preview-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .audio-preview-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    max-width: 400px;
                    width: 90%;
                }

                .audio-preview-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 20px 0;
                }

                .audio-preview-header h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .audio-preview-body {
                    padding: 20px;
                }

                .audio-player {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    background: var(--bg-secondary);
                    border-radius: 12px;
                }

                .audio-play-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    background: var(--primary-color);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 18px;
                    transition: background-color 0.2s;
                }

                .audio-play-btn:hover {
                    background: var(--secondary-color);
                }

                .audio-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .audio-duration {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .audio-size {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .audio-preview-actions {
                    padding: 0 20px 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
            `;
      document.head.appendChild(styles);
    }

    // Event listeners
    const audio = preview.querySelector("#preview-audio");
    const playBtn = preview.querySelector("#preview-play-btn");
    const closeBtn = preview.querySelector(".audio-preview-close");
    const discardBtn = preview.querySelector(".audio-discard");
    const sendBtn = preview.querySelector(".audio-send");

    // Play/pause functionality
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    audio.addEventListener("ended", () => {
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    // Close handlers
    const closePreview = () => {
      URL.revokeObjectURL(audioUrl);
      preview.remove();
    };

    closeBtn.addEventListener("click", closePreview);
    discardBtn.addEventListener("click", closePreview);

    // Send handler
    sendBtn.addEventListener("click", () => {
      this.sendVoiceMessage(file);
      closePreview();
    });

    // Close on overlay click
    preview.addEventListener("click", (e) => {
      if (e.target === preview) {
        closePreview();
      }
    });

    document.body.appendChild(preview);
  }

  async sendVoiceMessage(audioFile) {
    try {
      if (!window.chatApp || !window.chatApp.currentChat) {
        UIHelpers.showToast("Please select a chat first", "error");
        return;
      }

      const formData = new FormData();
      formData.append("media", audioFile);
      formData.append("content", "");

      if (window.chatApp.currentChatType === "direct") {
        formData.append("receiver_id", window.chatApp.currentChat);
      } else {
        formData.append("group_id", window.chatApp.currentChat);
      }

      formData.append("is_anonymous", window.chatApp.isAnonymous);

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const message = await response.json();
        // Message will be handled by socket event
        UIHelpers.showToast("Voice message sent!", "success");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to send voice message");
      }
    } catch (error) {
      console.error("Failed to send voice message:", error);
      UIHelpers.showToast("Failed to send voice message", "error");
    }
  }

  showRecordingUI() {
    const voiceBtn = document.getElementById("voice-btn");
    const recordingUI = document.getElementById("voice-recording");
    const messageInputArea = document.getElementById("message-input-area");

    if (voiceBtn) {
      voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
      voiceBtn.classList.add("recording");
    }

    if (recordingUI) {
      recordingUI.style.display = "flex";
    }

    // Setup cancel and send buttons
    const cancelBtn = recordingUI?.querySelector(".btn-cancel-recording");
    const sendBtn = recordingUI?.querySelector(".btn-send-recording");

    if (cancelBtn) {
      cancelBtn.onclick = () => this.stopRecording();
    }

    if (sendBtn) {
      sendBtn.onclick = () => this.stopRecording();
    }
  }

  hideRecordingUI() {
    const voiceBtn = document.getElementById("voice-btn");
    const recordingUI = document.getElementById("voice-recording");

    if (voiceBtn) {
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceBtn.classList.remove("recording");
    }

    if (recordingUI) {
      recordingUI.style.display = "none";
    }
  }

  startRecordingTimer() {
    const timerElement = document.querySelector(".recording-time");
    if (!timerElement) return;

    this.recordingTimer = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const displaySeconds = seconds % 60;

      timerElement.textContent = `${minutes}:${displaySeconds
        .toString()
        .padStart(2, "0")}`;
    }, 1000);
  }

  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  setupFileUpload() {
    const fileInput = document.getElementById("file-input");
    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => this.handleFileSelection(file));
    });
  }

  setupDragAndDrop() {
    const chatContainer = document.querySelector(".main-chat");
    if (!chatContainer) return;

    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      chatContainer.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area
    ["dragenter", "dragover"].forEach((eventName) => {
      chatContainer.addEventListener(
        eventName,
        this.highlight.bind(this),
        false
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      chatContainer.addEventListener(
        eventName,
        this.unhighlight.bind(this),
        false
      );
    });

    // Handle dropped files
    chatContainer.addEventListener("drop", this.handleDrop.bind(this), false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight(e) {
    const chatContainer = document.querySelector(".main-chat");
    if (chatContainer) {
      chatContainer.classList.add("drag-over");
    }
  }

  unhighlight(e) {
    const chatContainer = document.querySelector(".main-chat");
    if (chatContainer) {
      chatContainer.classList.remove("drag-over");
    }
  }

  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    files.forEach((file) => this.handleFileSelection(file));
  }

  handleFileSelection(file) {
    // Validate file
    if (!this.validateFile(file)) return;

    // Show file preview
    this.showFilePreview(file);
  }

  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/webm",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (file.size > maxSize) {
      UIHelpers.showToast(
        `File too large. Maximum size is ${UIHelpers.formatFileSize(maxSize)}`,
        "error"
      );
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      UIHelpers.showToast("File type not supported", "error");
      return false;
    }

    return true;
  }

  showFilePreview(file) {
    const preview = document.getElementById("file-preview");
    const fileName = preview?.querySelector(".file-name");
    const fileIcon = preview?.querySelector("i");

    if (preview && fileName) {
      fileName.textContent = file.name;
      preview.style.display = "flex";

      // Update icon based on file type
      if (fileIcon) {
        fileIcon.className = UIHelpers.getFileIcon(file.name);
      }

      // Store file reference
      if (window.chatApp) {
        window.chatApp.selectedFile = file;
      }

      // Setup remove button
      const removeBtn = preview.querySelector(".btn-remove");
      if (removeBtn) {
        removeBtn.onclick = () => this.clearFilePreview();
      }
    }

    // Show detailed preview for images
    if (UIHelpers.isImageFile(file)) {
      this.showImagePreview(file);
    }
  }

  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement("div");
      preview.className = "image-upload-preview";
      preview.innerHTML = `
                <div class="image-upload-overlay">
                    <div class="image-upload-content">
                        <div class="image-upload-header">
                            <h3>Image Preview</h3>
                            <button class="btn-close image-upload-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="image-upload-body">
                            <img src="${e.target.result}" alt="${
        file.name
      }" class="preview-image">
                            <div class="image-info">
                                <span class="image-name">${file.name}</span>
                                <span class="image-size">${UIHelpers.formatFileSize(
                                  file.size
                                )}</span>
                            </div>
                        </div>
                        <div class="image-upload-actions">
                            <button class="btn-secondary image-discard">Cancel</button>
                            <button class="btn-primary image-send">Send Image</button>
                        </div>
                    </div>
                </div>
            `;

      // Add styles if not already added
      if (!document.getElementById("image-upload-styles")) {
        const styles = document.createElement("style");
        styles.id = "image-upload-styles";
        styles.textContent = `
                    .image-upload-preview {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }

                    .image-upload-content {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                        max-width: 500px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                    }

                    .image-upload-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 20px 20px 0;
                    }

                    .image-upload-header h3 {
                        font-size: 18px;
                        font-weight: 600;
                        color: var(--text-primary);
                        margin: 0;
                    }

                    .image-upload-body {
                        padding: 20px;
                        text-align: center;
                    }

                    .preview-image {
                        max-width: 100%;
                        max-height: 300px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                    }

                    .image-info {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .image-name {
                        font-size: 14px;
                        font-weight: 500;
                        color: var(--text-primary);
                    }

                    .image-size {
                        font-size: 12px;
                        color: var(--text-secondary);
                    }

                    .image-upload-actions {
                        padding: 0 20px 20px;
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                    }
                `;
        document.head.appendChild(styles);
      }

      // Event listeners
      const closeBtn = preview.querySelector(".image-upload-close");
      const discardBtn = preview.querySelector(".image-discard");
      const sendBtn = preview.querySelector(".image-send");

      const closePreview = () => preview.remove();

      closeBtn.addEventListener("click", closePreview);
      discardBtn.addEventListener("click", closePreview);

      sendBtn.addEventListener("click", () => {
        this.sendFileMessage(file);
        closePreview();
      });

      preview.addEventListener("click", (e) => {
        if (e.target === preview) {
          closePreview();
        }
      });

      document.body.appendChild(preview);
    };

    reader.readAsDataURL(file);
  }

  clearFilePreview() {
    const preview = document.getElementById("file-preview");
    if (preview) {
      preview.style.display = "none";
    }

    const fileInput = document.getElementById("file-input");
    if (fileInput) {
      fileInput.value = "";
    }

    if (window.chatApp) {
      window.chatApp.selectedFile = null;
    }
  }

  async sendFileMessage(file) {
    try {
      if (!window.chatApp || !window.chatApp.currentChat) {
        UIHelpers.showToast("Please select a chat first", "error");
        return;
      }

      const formData = new FormData();
      formData.append("media", file);
      formData.append("content", "");

      if (window.chatApp.currentChatType === "direct") {
        formData.append("receiver_id", window.chatApp.currentChat);
      } else {
        formData.append("group_id", window.chatApp.currentChat);
      }

      formData.append("is_anonymous", window.chatApp.isAnonymous);

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const message = await response.json();
        UIHelpers.showToast("File sent successfully!", "success");
        this.clearFilePreview();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to send file");
      }
    } catch (error) {
      console.error("Failed to send file:", error);
      UIHelpers.showToast("Failed to send file", "error");
    }
  }

  setupMediaPreview() {
    // Add click handlers to media messages for full-screen preview
    document.addEventListener("click", (e) => {
      if (e.target.matches(".message-media img")) {
        UIHelpers.createImagePreview(e.target.src, e.target.alt);
      }
    });
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}

// Initialize media handler when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.mediaHandler = new MediaHandler();

  // Add drag-over styles
  const styles = document.createElement("style");
  styles.textContent = `
        .main-chat.drag-over {
            background: rgba(102, 126, 234, 0.1);
            position: relative;
        }

        .main-chat.drag-over::after {
            content: "Drop files here to upload";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: 600;
            color: var(--primary-color);
            text-align: center;
            z-index: 1000;
            background: white;
            padding: 20px 40px;
            border-radius: 12px;
            border: 2px dashed var(--primary-color);
        }

        .btn-icon.recording {
            background: var(--error-color) !important;
            color: white !important;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }
    `;
  document.head.appendChild(styles);
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = MediaHandler;
} else {
  window.MediaHandler = MediaHandler;
}
