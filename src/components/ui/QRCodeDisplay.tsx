/**
 * QR Code Component with Download Functionality
 * Styled with centered ReVil logo
 */

"use client";

import { useEffect, useState, useRef } from "react";

interface QRCodeDisplayProps {
  data: string | object;
  size?: number;
  filename?: string;
  className?: string;
  showDownloadButton?: boolean;
}

export default function QRCodeDisplay({
  data,
  size = 300,
  filename = "qr-code.png",
  className = "",
  showDownloadButton = true,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);

  // 1. Load the library once
  useEffect(() => {
    let isMounted = true;

    import("qr-code-styling").then((module) => {
      if (!isMounted) return;

      const QRCodeStyling = module.default;

      // Initialize the instance ONCE
      qrCodeInstance.current = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg", // SVG is often crisper, but canvas is fine too
        data: typeof data === "string" ? data : JSON.stringify(data),
        image: "/revil_icon.png",
        margin: 10,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "H",
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.3,
          margin: 8,
          crossOrigin: "anonymous",
        },
        dotsOptions: {
          type: "dots", // Fully rounded dots/balls
          color: "#00f0ff",
        },
        backgroundOptions: {
          color: "#000000",
        },
        cornersSquareOptions: {
          type: "extra-rounded", // Fully rounded corner squares
          color: "#00f0ff",
        },
        cornersDotOptions: {
          type: "dot", // Circular corner dots
          color: "#00f0ff",
        },
      });

      // Append to DOM
      if (qrRef.current) {
        qrCodeInstance.current.append(qrRef.current);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array: runs once on mount

  // 2. Update the existing instance when props change
  useEffect(() => {
    if (!qrCodeInstance.current) return;

    const qrData = typeof data === "string" ? data : JSON.stringify(data);

    // Use .update() method to efficiently redraw
    qrCodeInstance.current.update({
      width: size,
      height: size,
      data: qrData,
    });

    // Generate new download URL
    const generateUrl = async () => {
      try {
        const url = await qrCodeInstance.current.getRawData("png");
        const dataUrl = URL.createObjectURL(url as Blob);

        // Clean up previous URL to prevent memory leaks
        setQrCodeUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return dataUrl;
        });
      } catch (err) {
        console.error("Error generating raw data", err);
      }
    };

    generateUrl();
  }, [data, size]); // Run only when data/size changes

  const handleDownload = async () => {
    if (!qrCodeInstance.current) return;
    try {
      await qrCodeInstance.current.download({
        name: filename.replace(".png", ""),
        extension: "png",
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-black p-4 rounded-lg border border-primary/30">
        {/* Container for the QR Code */}
        <div
          ref={qrRef}
          className="flex items-center justify-center min-h-[300px] min-w-[300px]"
        >
          {loading && (
            <div className="animate-pulse text-primary">Loading...</div>
          )}
        </div>
      </div>

      {showDownloadButton && !loading && (
        <button
          onClick={handleDownload}
          className="w-full px-4 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download QR Code
        </button>
      )}
    </div>
  );
}
