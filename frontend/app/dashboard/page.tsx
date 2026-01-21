"use client";

import { useEffect, useState } from "react";
import { Download, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
    const [jobs, setJobs] = useState<any[]>([]); // In a real app this would come from a DB
    // For this offline clone, we'll cheat and just look at the last few inputs or mock it 
    // since we don't have a persistent DB in this code yet.
    // Actually, let's just use local storage or query a new 'list all jobs' endpoint if we had one.
    // BUT: The user asked for a "clone". 
    // Let's rely on the user having just uploaded something or stored IDs in localStorage.

    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [jobData, setJobData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load recent job from local storage for demo purposes
        const recent = localStorage.getItem("captionBeastRecentJob");
        if (recent) {
            setActiveJobId(recent);
        }
    }, []);

    useEffect(() => {
        if (!activeJobId) return;

        const fetchJob = async () => {
            try {
                setLoading(true);
                let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:7860';
                const res = await axios.get(`${apiUrl}/status/${activeJobId}`);
                setJobData(res.data);
                setLoading(false);

                // Poll if processing
                if (res.data.status === 'processing' || res.data.status === 'queued') {
                    setTimeout(fetchJob, 3000);
                }
            } catch (e) {
                console.error("Failed to fetch job", e);
                setLoading(false);
            }
        };

        fetchJob();
    }, [activeJobId]);

    if (!activeJobId) {
        return (
            <div className="min-h-screen bg-stone-950 text-white p-20 text-center">
                <h1 className="text-3xl font-bold text-stone-300">No recent projects found</h1>
                <p className="text-stone-500 mt-4">Go back home to upload a video.</p>
                <a href="/" className="inline-block mt-8 px-6 py-3 bg-yellow-400 text-black rounded-xl font-bold">Create New</a>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-950 text-white font-sans">
            <nav className="border-b border-white/10 bg-stone-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="text-xl font-bold tracking-tight">Caption<span className="text-yellow-400">Beast</span></a>
                    <div className="text-sm text-stone-400">Project: {activeJobId.slice(0, 8)}...</div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Viral Clips</h1>
                    <div className="flex items-center gap-2">
                        {jobData?.status === 'processing' ? (
                            <span className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full text-sm">
                                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                Analyzing & Clipping...
                            </span>
                        ) : jobData?.status === 'completed' ? (
                            <span className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed
                            </span>
                        ) : (
                            <span className="text-stone-500">Wait...</span>
                        )}
                    </div>
                </div>

                {jobData?.clips && jobData.clips.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobData.clips.map((clip: any, idx: number) => (
                            <div key={idx} className="bg-stone-900 rounded-2xl overflow-hidden border border-white/5 hover:border-yellow-400/30 transition shadow-xl">
                                <div className="aspect-[9/16] bg-black relative group">
                                    <video
                                        src={`http://127.0.0.1:7860${clip.url}`}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md text-xs font-mono border border-white/10">
                                        Score: {clip.score}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                                        {clip.reason}
                                    </h3>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-stone-500 text-sm">
                                            {(clip.duration || 0).toFixed(1)}s
                                        </span>
                                        <a
                                            href={`http://127.0.0.1:7860${clip.url}`}
                                            download
                                            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-stone-200 transition"
                                        >
                                            <Download className="w-4 h-4" /> Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-stone-900/30 rounded-3xl border border-dashed border-white/10">
                        <p className="text-stone-400">Processing video... Clips will appear here.</p>
                    </div>
                )}

            </main>
        </div>
    );
}
