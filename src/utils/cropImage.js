export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export async function getCroppedImg(imageSrc, pixelCrop, quality = 0.85) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Convert cropped canvas image to WebP format
    return canvas.toDataURL('image/webp', quality);
}

export async function convertToWebP(imageSrc, quality = 0.85) {
    if (!imageSrc) return '';
    if (typeof imageSrc === 'string' && imageSrc.startsWith('data:image/webp')) {
        return imageSrc;
    }
    try {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width || 800;
        canvas.height = image.naturalHeight || image.height || 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) return imageSrc;
        ctx.drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', quality);
    } catch {
        return imageSrc;
    }
}
