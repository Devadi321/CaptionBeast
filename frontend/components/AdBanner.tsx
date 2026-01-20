import React from 'react';

interface AdBannerProps {
    slotId?: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
}

export default function AdBanner({ slotId, format = 'auto', className = '' }: AdBannerProps) {
    // In production, this would inject the Google AdSense script.
    // For now, we show a placeholder in development, or if slotId is missing.

    if (!slotId) {
        return (
            <div className={`bg-stone-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-center text-stone-600 text-xs uppercase tracking-widest ${className}`} style={{ minHeight: '100px' }}>
                Advertisement Slot
            </div>
        );
    }

    return (
        <div className={`overflow-hidden rounded-xl ${className}`}>
            {/* Google AdSense Implementation */}
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"></ins>
            <script>
                {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </script>
        </div>
    );
}
