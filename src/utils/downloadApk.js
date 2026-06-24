export const downloadApk = async () => {
  try {
    const url = '/downloads/orvix-v9.apk';
    const checkUrl = `${url}&t=${Date.now()}`;
    const response = await fetch(checkUrl, { method: 'HEAD', cache: 'no-store' });
    
    if (response.ok) {
      // Create a hidden anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orvix-v9.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("APK build is not uploaded yet.");
    }
  } catch (error) {
    console.error("Error checking APK:", error);
    alert("APK build is not uploaded yet.");
  }
};
