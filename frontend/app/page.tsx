"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Upload, FileVideo, Download, Loader2, Sparkles, Play } from "lucide-react";
import clsx from "clsx";
import AdBanner from "@/components/AdBanner";
import SocialShare from "@/components/SocialShare";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = "local-user"; // Hardcoded for local mode
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wake up server on load
  useEffect(() => {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://adithyan321-caption-beast-backend.hf.space';
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      apiUrl = 'http://127.0.0.1:7860';
    }
    // Fire and forget ping
    console.log("Pinging server to wake up...");
    axios.get(apiUrl).catch(() => { });
  }, []);

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
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://adithyan321-caption-beast-backend.hf.space';
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        apiUrl = 'http://127.0.0.1:7860';
      }

      // 1. Upload and get Job ID
      console.log("Starting upload...");
      const uploadResp = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const jobId = uploadResp.data.job_id;
      console.log("Job started:", jobId);

      // Save to local storage for the dashboard to pick up
      localStorage.setItem("captionBeastRecentJob", jobId);

      // Redirect to dashboard immediately
      window.location.href = "/dashboard";
      // Polling moved to dashboard


    } catch (err: any) {
      console.error(err);
      if (err.response && (err.response.status === 503 || err.response.status === 504)) {
        setError("😴 The free server is sleeping! It is waking up now. Please wait 1 minute and try again.");
      } else {
        setError("Failed to start upload. " + (err.response?.data?.detail || err.message));
      }
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-yellow-500 selection:text-black">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-stone-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-lg rotate-3 group-hover:rotate-6 transition">
              <Sparkles className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">Caption<span className="text-yellow-400">Beast v5.0</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-stone-400">
              Local Mode
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Ad Slot 1: Top of Content */}
        <div className="mb-12">
          <AdBanner slotId="top-banner-slot" className="w-full h-24 bg-stone-900/50" />
        </div>

        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
            Make your videos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Go Viral
            </span>
          </h1>
          <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Generate explosive, word-by-word captions in the style of top creators.
            <br /> <span className="text-yellow-400 font-bold">100% Free. Powered by Ads.</span>
          </p>
        </div>

        {/* Upload Area - Always Visible (No Authentication Gate) */}
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

        {/* Ad Slot 2: Below Upload */}
        <div className="mt-12 mb-12">
          <AdBanner slotId="middle-banner-slot" className="w-full h-32 bg-stone-900/50" />
        </div>

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
                    const target = e.target as HTMLVideoElement;
                    target.style.border = "2px solid red";
                    alert(`Error loading video from: ${videoUrl}\n\nTry the 'Download Video' button instead.`);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              {/* Ad Slot 3: Near Download */}
              <AdBanner slotId="download-banner-slot" className="w-full max-w-md h-24 bg-stone-900/50" />

              <div className="flex gap-4">
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
                  download="caption-beast-viral.mp4"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold text-lg inline-flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
                >
                  <Download className="w-5 h-5" />
                  Download Video
                </a>
              </div>

              <SocialShare />
            </div>
          </div>
        )
        }

        {/* SEO & Features Section */}
        <div className="mt-32 border-t border-white/10 pt-20">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-stone-900/30 p-8 rounded-3xl border border-white/5 hover:border-yellow-400/20 transition">
              <h3 className="text-xl font-bold mb-4 text-white">Free AI Caption Generator</h3>
              <p className="text-stone-400 leading-relaxed">
                Stop paying for expensive tools. CaptionBeast offers professional grade <strong className="text-stone-300">auto-subtitles</strong> completely free.
                Perfect for TikTok, Instagram Reels, and YouTube Shorts.
              </p>
            </div>
            <div className="bg-stone-900/30 p-8 rounded-3xl border border-white/5 hover:border-yellow-400/20 transition">
              <h3 className="text-xl font-bold mb-4 text-white">No Watermark & No Login</h3>
              <p className="text-stone-400 leading-relaxed">
                Download your captioned videos instantly without annoying watermarks or forced sign-ups.
                We believe in quick, frictionless video editing.
              </p>
            </div>
            <div className="bg-stone-900/30 p-8 rounded-3xl border border-white/5 hover:border-yellow-400/20 transition">
              <h3 className="text-xl font-bold mb-4 text-white">Viral "Hormozi" Style</h3>
              <p className="text-stone-400 leading-relaxed">
                Get that explosive word-by-word animation style made famous by top creators.
                Our AI ensures perfect timing and engagement.
              </p>
            </div>
          </div>

          <article className="prose prose-invert prose-lg mx-auto text-stone-400">
            <h2 className="text-3xl font-bold text-white text-center mb-8">How to Add Captions to Video for Free?</h2>
            <div className="space-y-6">
              <p>
                Adding captions to your videos is the #1 way to increase retention and engagement.
                With CaptionBeast, you don't need complex software like Adobe Premiere or payments for tools like OpusClip.
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>Upload your video</strong>: We support MP4, MOV, and WEBM formats up to 50MB.</li>
                <li><strong>Wait for AI processing</strong>: Our advanced transcription engine (OpenAI Whisper) detects speech automatically.</li>
                <li><strong>Download result</strong>: Get your fully edited video with burned-in subtitles, ready to post.</li>
              </ol>
              <p>
                Whether you are a creator, marketer, or business owner, our <em>free caption generator</em> helps you
                reach a wider audience by making your content accessible and engaging, even with sound off.
              </p>
            </div>
          </article>

          {/* JSON-LD Structured Data for Google */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "CaptionBeast",
                "applicationCategory": "MultimediaApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "description": "Free AI video caption generator. Add viral subtitles to your videos instantly.",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.9",
                  "ratingCount": "1250"
                }
              })
            }}
          />
        </div>
      </main >

      <footer className="border-t border-white/5 mt-20 py-12 text-center text-stone-500 text-sm">
        <p className="mb-4">&copy; {new Date().getFullYear()} CaptionBeast AI. <span className="text-stone-700 ml-2">v5.0 (Ad-Supported)</span></p>
        <div className="flex justify-center gap-6 text-stone-600">
          <a href="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</a>
          <a href="/contact" className="hover:text-yellow-400 transition-colors">Contact Us</a>
        </div>
      </footer>
    </div >
  );
}
