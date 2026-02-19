"use client";

import { useState, useEffect } from "react";
import { CreditCard, Check, Gift, ArrowLeft } from "lucide-react";
import axios from "axios";

const CONTRA_PAYMENT_LINK = "https://contra.com/payment-link/ArcQFsbC-caption-beast";

interface CreditPackage {
    id: string;
    credits: number;
    price: number;
    popular?: boolean;
}

const packages: CreditPackage[] = [
    { id: "starter", credits: 10, price: 5 },
    { id: "pro", credits: 50, price: 20, popular: true },
    { id: "business", credits: 100, price: 35 },
];

export default function BuyCredits() {
    const [userId, setUserId] = useState<string>("");
    const [credits, setCredits] = useState<number>(0);
    const [promoCode, setPromoCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Get user_id from localStorage or URL
        const storedUserId = localStorage.getItem("captionBeastUserId");
        if (storedUserId) {
            setUserId(storedUserId);
            fetchCredits(storedUserId);
        } else {
            // Generate new user ID
            const newUserId = "user_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("captionBeastUserId", newUserId);
            setUserId(newUserId);
            setCredits(3); // Free credits for new users
        }
    }, []);

    const fetchCredits = async (id: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const res = await axios.get(`${apiUrl}/credits/${id}`);
            setCredits(res.data.credits);
        } catch (e) {
            console.error("Failed to fetch credits", e);
        }
    };

    const handlePromoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode.trim()) return;
        
        setLoading(true);
        setMessage("");
        
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const res = await axios.post(`${apiUrl}/credits/redeem`, {
                user_id: userId,
                code: promoCode.trim().toUpperCase()
            });
            
            setCredits(res.data.new_balance);
            setMessage(`🎉 Success! Added ${res.data.credits_added} credits!`);
            setPromoCode("");
        } catch (e: any) {
            setMessage(e.response?.data?.detail || "Invalid promo code");
        }
        
        setLoading(false);
    };

    const handleBuyClick = (pkg: CreditPackage) => {
        // Redirect to Contra payment
        window.open(CONTRA_PAYMENT_LINK, "_blank");
    };

    const copyUserId = () => {
        navigator.clipboard.writeText(userId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-stone-950 text-white font-sans">
            <nav className="border-b border-white/10 bg-stone-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Caption<span className="text-yellow-400">Beast</span>
                    </a>
                    <div className="flex items-center gap-3">
                        <div className="bg-stone-800 px-4 py-2 rounded-full flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-yellow-400" />
                            <span className="font-bold">{credits} Credits</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Current Balance */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Buy Credits</h1>
                    <p className="text-stone-400 mb-6">
                        Your current balance: <span className="text-yellow-400 font-bold text-xl">{credits} credits</span>
                    </p>
                    
                    {/* User ID for manual credit addition */}
                    <div className="bg-stone-900/50 p-4 rounded-xl inline-block">
                        <p className="text-sm text-stone-500 mb-1">Your User ID (for manual credit addition):</p>
                        <div className="flex items-center gap-2">
                            <code className="bg-stone-800 px-3 py-1 rounded text-sm font-mono">{userId}</code>
                            <button 
                                onClick={copyUserId}
                                className="text-xs text-stone-400 hover:text-white"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Credit Packages */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {packages.map((pkg) => (
                        <div 
                            key={pkg.id}
                            className={`relative bg-stone-900 rounded-2xl p-6 border ${
                                pkg.popular 
                                ? "border-yellow-400 scale-105" 
                                : "border-white/10"
                            }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                                    MOST POPULAR
                                </div>
                            )}
                            
                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-white mb-1">{pkg.credits}</div>
                                <div className="text-stone-400">credits</div>
                            </div>
                            
                            <div className="text-center mb-6">
                                <span className="text-3xl font-bold">${pkg.price}</span>
                            </div>
                            
                            <button
                                onClick={() => handleBuyClick(pkg)}
                                className={`w-full py-3 rounded-xl font-bold transition ${
                                    pkg.popular
                                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                                    : "bg-stone-800 text-white hover:bg-stone-700"
                                }`}
                            >
                                Buy via Contra
                            </button>
                        </div>
                    ))}
                </div>

                {/* Payment Info */}
                <div className="bg-stone-900/50 rounded-2xl p-8 mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-yellow-400" />
                        How to get credits
                    </h2>
                    <ol className="space-y-3 text-stone-300">
                        <li className="flex gap-3">
                            <span className="text-yellow-400 font-bold">1.</span>
                            Click "Buy via Contra" above
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-400 font-bold">2.</span>
                            Complete payment on Contra
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-400 font-bold">3.</span>
                            Contact me with your User ID to get credits added
                        </li>
                    </ol>
                    
                    <div className="mt-6 p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                        <p className="text-sm text-yellow-400">
                            💡 <strong>Tip:</strong> Use promo code <code className="bg-stone-800 px-2 py-0.5 rounded">FREE10</code> for 10 free credits!
                        </p>
                    </div>
                </div>

                {/* Promo Code */}
                <div className="bg-stone-900/50 rounded-2xl p-8">
                    <h2 className="text-xl font-bold mb-4">Have a promo code?</h2>
                    <form onSubmit={handlePromoSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-yellow-400"
                        />
                        <button
                            type="submit"
                            disabled={loading || !promoCode.trim()}
                            className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "..." : "Redeem"}
                        </button>
                    </form>
                    {message && (
                        <p className={`mt-3 ${message.includes("Success") ? "text-green-400" : "text-red-400"}`}>
                            {message}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
