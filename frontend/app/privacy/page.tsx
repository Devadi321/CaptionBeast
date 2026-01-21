export default function Privacy() {
    return (
        <main className="min-h-screen bg-stone-950 text-stone-300 font-sans p-8 md:p-20">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                    <p>
                        Welcome to CaptionBeast ("we," "our," or "us"). We respect your privacy and are committed to protecting it through our compliance with this policy.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
                    <p>
                        <strong>Uploaded Content:</strong> Videos you upload are processed temporarily to generate captions and are then deleted from our servers. We do not store your videos permanently.
                    </p>
                    <p>
                        <strong>Usage Data:</strong> We may collect anonymous data about how you access and use the Service.
                    </p>
                    <p>
                        <strong>Cookies:</strong> We use cookies to enhance your experience and to serve advertisements via Google AdSense.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Advertising (Google AdSense)</h2>
                    <p>
                        We use Google AdSense to display ads. Google uses cookies (including the DoubleClick cookie) to serve ads based on your previous visits to our website or other websites on the internet.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
                        <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
                        <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-yellow-400 hover:underline">Ads Settings</a>.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Data Security</h2>
                    <p>
                        We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at support@captionbeast.com.
                    </p>
                </section>

                <div className="pt-8 border-t border-white/10">
                    <a href="/" className="text-yellow-400 hover:underline">← Back to Home</a>
                </div>
            </div>
        </main>
    );
}
