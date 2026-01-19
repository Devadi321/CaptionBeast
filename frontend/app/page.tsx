"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Upload, FileVideo, Download, Loader2, Sparkles, Play } from "lucide-react";
import clsx from "clsx";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // Fake progress for improved UX
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth(); // Clerk Hook

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(5);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (userId) {
      formData.append("user_id", userId);
    }

    try {
      // Auto-detect API URL: Use localhost if on localhost, otherwise prod
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://adithyan321-caption-beast-backend.hf.space';

      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // If we are running locally, default to local backend (unless env var is explicitly set to something else)
        // We assume local backend runs on 7860
        apiUrl = 'http://127.0.0.1:7860';
      }

      // 1. Upload and get Job ID
      console.log("Starting upload...");
      const uploadResp = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const jobId = uploadResp.data.job_id;
      console.log("Job started:", jobId);

      // 2. Poll for status
      const pollInterval = setInterval(async () => {
        try {
          // Slowly animate progress while waiting
          setProgress((prev) => (prev < 90 ? prev + 1 : prev));

          const statusResp = await axios.get(`${apiUrl}/status/${jobId}`);
          const status = statusResp.data.status;
          console.log("Status:", status);

          if (status === 'completed') {
            const videoPath = statusResp.data.video_url;
            console.log("Completed! Video Path:", videoPath);

            // Valid path must be a string and longer than 5 chars
            if (videoPath && typeof videoPath === 'string' && videoPath.length > 5) {
              clearInterval(pollInterval);
              setProgress(100);

              // Ensure no double slashes if API URL ends with slash
              const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
              const cleanVideoPath = videoPath.startsWith('/') ? videoPath : `/${videoPath}`;

              const finalUrl = `${cleanApiUrl}${cleanVideoPath}`;
              console.log("Final URL:", finalUrl);
              setVideoUrl(finalUrl);
              setUploading(false);
            } else {
              console.warn("Status completed but video_url invalid, retrying...", videoPath);
              // Do not clear interval, keep polling until backend creates the link
            }

          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setError("Processing failed: " + statusResp.data.error);
            setUploading(false);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError("Failed to start upload. " + (err.response?.data?.detail || err.message));
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-yellow-500 selection:text-black">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-stone-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          import {SignInButton, SignedIn, SignedOut, UserButton} from "@clerk/nextjs";

          // ...

          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-lg rotate-3 group-hover:rotate-6 transition">
              <Sparkles className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">Caption<span className="text-yellow-400">Beast v3.0</span></span>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium hover:text-white transition">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
            Make your videos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Go Viral
            </span>
          </h1>
          <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Generate explosive, word-by-word captions in the style of top creators.
            Just upload your video and let our AI do the magic.
          </p>
        </div>

        {/* Upload Area - Protected */}
        <SignedOut>
          <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center bg-stone-900/50">
            <p className="text-2xl font-bold mb-4">Join to go viral</p>
            <p className="text-stone-400 mb-8 max-w-md mx-auto">Sign in to unlock AI captioning, unlimited downloads, and pro features.</p>
            <SignInButton mode="modal">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95">
                Sign In to Create
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {!videoUrl && (
            <div
              className={clsx(
                "border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer bg-stone-900/50 hover:bg-stone-900",
                file ? "border-yellow-400/50 bg-yellow-400/5" : "border-white/10 hover:border-white/30"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-2">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                  ) : file ? (
                    <FileVideo className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <Upload className="w-8 h-8 text-stone-400" />
                  )}
                </div>

                {uploading ? (
                  <div className="w-full max-w-sm space-y-3">
                    <p className="text-lg font-medium animate-pulse">Processing your video...</p>
                    <p className="text-sm text-stone-500">Transcribing audio • Generating captions • Rendering</p>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : file ? (
                  <div className="space-y-4">
                    <p className="text-2xl font-semibold">{file.name}</p>
                    <p className="text-stone-400 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      Generate Captions
                    </button>
                    <p className="text-xs text-stone-500 mt-2">Click change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xl font-semibold">Click to upload or drag and drop</p>
                    <p className="text-stone-500">MP4, MOV, or WEBM (Max 50MB reccomended)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SignedIn>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Result Area */}
        {videoUrl && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-stone-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-400/10">
              <div className="aspect-video bg-black relative flex items-center justify-center group">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Video load failed", e);
                    // Force a reload of the element or show a helpful message
                    const target = e.target as HTMLVideoElement;
                    target.style.border = "2px solid red";
                    alert(`Error loading video from: ${videoUrl}\n\nTry the 'Download Video' button instead.`);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setVideoUrl(null);
                  setFile(null);
                  setProgress(0);
                }}
                className="px-6 py-3 rounded-xl font-medium text-stone-300 hover:text-white hover:bg-white/5 transition"
              >
                Create Another
              </button>

              <a
                href={videoUrl}
                download={`caption-beast-${Date.now()}.mp4`}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold text-lg inline-flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                <Download className="w-5 h-5" />
                Download Video
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20 py-12 text-center text-stone-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CaptionBeast AI. All rights reserved. <span className="text-stone-700 ml-2">v2.0</span></p>
      </footer>
    </div>
  );
}
