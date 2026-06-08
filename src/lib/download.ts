// Safe blob-based downloads — never use <a href="data:..."> which some
// extensions/handlers can intercept (e.g. Google Calendar add-event URLs).

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  // Important: keep it out of the DOM tree so no parent listener can hijack it
  a.style.position = "fixed";
  a.style.left = "-9999px";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);base64/.exec(meta)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function openImageInNewTab(dataUrl: string) {
  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  // Don't revoke immediately — the new tab needs it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
