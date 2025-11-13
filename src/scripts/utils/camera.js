let width = 320;
let height = 0;
let streaming = false;

export class CameraUtil {
    constructor() {
        this.stream = null;
        this.isActive = false;
    }

    async initCamera(videoElement, canvasElement, takeButtonElement, outputElement) {
        this.cameraVideo = videoElement;
        this.cameraCanvas = canvasElement;
        this.cameraTakeButton = takeButtonElement;
        this.cameraOutputList = outputElement;

        this.cameraVideo.addEventListener('canplay', () => {
            if (streaming) {
                return;
            }
            height = (this.cameraVideo.videoHeight * width) / this.cameraVideo.videoWidth;
            this.cameraVideo.setAttribute('width', width.toString());
            this.cameraVideo.setAttribute('height', height.toString());
            this.cameraCanvas.setAttribute('width', width.toString());
            this.cameraCanvas.setAttribute('height', height.toString());
            streaming = true;
        });

        this.cameraTakeButton.addEventListener('click', () => {
            const imageUrl = this.takePicture();
            this.populateTakenPicture(imageUrl);
            this.onPictureTaken(imageUrl);
        });

        await this.startCamera();
    }

    populateTakenPicture(image) {
        this.cameraOutputList.innerHTML = `
      <figure class="camera-output">
        <img src="${image}" alt="Captured photo" style="max-width: 100%; border-radius: 5px;">
        <figcaption class="sr-only">Photo captured from camera</figcaption>
      </figure>
    `;
    }

    async getStream() {
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
        } catch (error) {
            throw new Error(`Camera access denied: ${error.message}`);
        }
    }

    async startCamera() {
        try {
            this.stream = await this.getStream();
            this.cameraVideo.srcObject = this.stream;
            this.cameraVideo.play();
            this.isActive = true;
        } catch (error) {
            console.error('Camera error:', error);
            throw error;
        }
    }

    takePicture() {
        const context = this.cameraCanvas.getContext('2d');
        this.cameraCanvas.width = width;
        this.cameraCanvas.height = height;
        context.drawImage(this.cameraVideo, 0, 0, width, height);

        return this.cameraCanvas.toDataURL('image/png');
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
            this.isActive = false;
            streaming = false;
        }
    }

    onPictureTaken(imageDataUrl) {
    }

    // Convert data URL to File object
    dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }
}