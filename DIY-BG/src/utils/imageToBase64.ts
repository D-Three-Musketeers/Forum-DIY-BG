export const imageToBase64 = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = path;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      
      try {
        const dataUrl = canvas.toDataURL('image/webp');
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = (err) => {
      reject(err);
    };
  });
};