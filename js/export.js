/* =========================================================================
   js/export.js
   -------------------------------------------------------------------------
   Voucher / report export: PNG, JPG, PDF (via html2canvas + jsPDF, loaded
   from CDN on the pages that need them) and WhatsApp sharing.
   ========================================================================= */

/**
 * Export a DOM element as PNG, JPG, or PDF.
 * @param {HTMLElement} el
 * @param {"png"|"jpg"|"pdf"} format
 * @param {string} filenameBase - filename without extension
 */
async function exportElement(el, format, filenameBase) {
  if (!el) {
    showToast("Nothing to export — preview not found.", "error");
    return;
  }
  if (typeof html2canvas === "undefined") {
    showToast("Export library failed to load. Check your internet connection.", "error");
    return;
  }

  showToast("Preparing export…", "info");

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true
    });

    if (format === "png" || format === "jpg") {
      const mime = format === "png" ? "image/png" : "image/jpeg";
      const quality = format === "jpg" ? 0.95 : undefined;
      const dataUrl = canvas.toDataURL(mime, quality);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${filenameBase}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Saved as ${format.toUpperCase()}.`, "success");
      return canvas;
    }

    if (format === "pdf") {
      if (!window.jspdf) {
        showToast("PDF library failed to load. Check your internet connection.", "error");
        return;
      }
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL("image/png");
      const pxToMm = (px) => (px * 25.4) / (96 * 2); // scale:2 above
      const imgWidthMm = pxToMm(canvas.width);
      const imgHeightMm = pxToMm(canvas.height);
      const orientation = imgWidthMm > imgHeightMm ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      let renderWidth = maxWidth;
      let renderHeight = (imgHeightMm * renderWidth) / imgWidthMm;
      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = (imgWidthMm * renderHeight) / imgHeightMm;
      }
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      pdf.save(`${filenameBase}.pdf`);
      showToast("Saved as PDF.", "success");
      return canvas;
    }
  } catch (err) {
    console.error(err);
    showToast("Export failed. Please try again.", "error");
  }
}

/**
 * Share a voucher/report via WhatsApp.
 *
 * Browsers cannot universally auto-attach a locally generated PDF/image to
 * a specific WhatsApp contact through a wa.me link — that capability does
 * not exist in standard web APIs. This function uses the best available
 * approach with a graceful fallback:
 *
 *  1. If the Web Share API with file support is available (most mobile
 *     browsers), it shares the voucher image directly — the user picks
 *     WhatsApp (or any app) from their native share sheet.
 *  2. Otherwise, it opens a wa.me link pre-filled with a text summary and
 *     lets the user pick the contact manually; the image/PDF should be
 *     exported separately (PNG/JPG/PDF buttons) and attached by hand.
 *
 * @param {HTMLElement} el - element to render as the shareable image
 * @param {string} textSummary - fallback text message
 * @param {string} filenameBase
 */
async function shareOnWhatsApp(el, textSummary, filenameBase) {
  // Try native share with file attachment first (best experience, mobile browsers).
  if (el && typeof html2canvas !== "undefined" && navigator.canShare) {
    try {
      showToast("Preparing share…", "info");
      const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        const file = new File([blob], `${filenameBase}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Intelligence Academy Voucher",
            text: textSummary
          });
          return;
        }
      }
    } catch (err) {
      // If the user cancels the native share sheet, don't fall through to wa.me.
      if (err && err.name === "AbortError") return;
      console.warn("Native share unavailable, falling back to wa.me link.", err);
    }
  }

  // Fallback: open WhatsApp with a pre-filled text message. The user selects
  // the contact manually and attaches the exported PNG/JPG/PDF themselves.
  const url = `https://wa.me/?text=${encodeURIComponent(textSummary)}`;
  window.open(url, "_blank", "noopener");
  showToast("WhatsApp opened with a text summary — attach the exported file manually.", "info");
}
