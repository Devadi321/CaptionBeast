import React, { useEffect } from 'react';

interface AdBannerProps {
    slotId?: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
}

export default function AdBanner({ slotId, format = 'auto', className = '' }: AdBannerProps) {
    useEffect(() => {
        try {
            if (slotId) {
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense Verification Error (Localhost ignore):", e);
        }
    }, [slotId]);

    if (!slotId) {
        return (
            <div className={`bg-stone-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-center text-stone-600 text-xs uppercase tracking-widest ${className}`} style={{ minHeight: '100px' }}>
                Advertisement Slot
            </div>
        );
    }

    return (
        <div className={`overflow-hidden rounded-xl ${className}`}>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-1920333630540777"}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"></ins>
        </div>
    );
}
