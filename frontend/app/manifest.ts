import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'CaptionBeast AI',
        short_name: 'CaptionBeast',
        description: 'Free AI Video Captions & Viral Subtitles Generator',
        start_url: '/',
        display: 'standalone',
        background_color: '#0c0a09',
        theme_color: '#facc15',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
