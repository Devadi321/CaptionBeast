import { Twitter, Linkedin, Facebook, Link2, MessageCircle } from "lucide-react";

export default function SocialShare() {
    const url = "https://caption-beast.vercel.app";
    const text = "I just added viral captions to my video for free using CaptionBeast! 🎥✨ No watermark & unlimited. Try it here:";
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    return (
        <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-6 w-full max-w-md text-center">
            <h3 className="text-white font-bold mb-4">Did you like it? Spread the word! 🚀</h3>
            <div className="flex justify-center gap-4">
                {/* Twitter / X */}
                <a
                    href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black hover:bg-stone-800 text-white p-3 rounded-full transition transform hover:scale-110"
                    title="Share on X"
                >
                    <Twitter className="w-5 h-5" />
                </a>

                {/* WhatsApp */}
                <a
                    href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 rounded-full transition transform hover:scale-110"
                    title="Share on WhatsApp"
                >
                    <MessageCircle className="w-5 h-5" />
                </a>

                {/* LinkedIn */}
                <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#0077b5] hover:bg-[#006396] text-white p-3 rounded-full transition transform hover:scale-110"
                    title="Share on LinkedIn"
                >
                    <Linkedin className="w-5 h-5" />
                </a>

                {/* Facebook */}
                <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1877F2] hover:bg-[#166fe5] text-white p-3 rounded-full transition transform hover:scale-110"
                    title="Share on Facebook"
                >
                    <Facebook className="w-5 h-5" />
                </a>
            </div>
            <p className="text-xs text-stone-500 mt-4">Help us keep this tool free forever!</p>
        </div>
    );
}
