export default function Terms() {
    return (
        <main className="min-h-screen bg-stone-950 text-stone-300 font-sans p-8 md:p-20">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using CaptionBeast, you agree to be bound by these Terms of Service. If you do not agree, strictly do not use our services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
                    <p>
                        CaptionBeast provides AI-powered video captioning services. We reserve the right to modify or discontinue the service at any time without notice.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. User Conduct</h2>
                    <p>
                        You agree not to upload any content that is illegal, offensive, or violates the rights of others. You retain all ownership rights to the content you upload.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Disclaimer of Warranties</h2>
                    <p>
                        The service is provided "as is" and "as available" without any warranties of any kind. We do not guarantee that the service will be error-free or uninterrupted.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Limitation of Liability</h2>
                    <p>
                        In no event shall CaptionBeast be liable for any indirect, incidental, special, or consequential damages arising out of your use of the service.
                    </p>
                </section>

                <div className="pt-8 border-t border-white/10">
                    <a href="/" className="text-yellow-400 hover:underline">← Back to Home</a>
                </div>
            </div>
        </main>
    );
}
