export default function Contact() {
    return (
        <main className="min-h-screen bg-stone-950 text-stone-300 font-sans p-8 md:p-20">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white">Contact Us</h1>

                <p className="text-lg">
                    Have questions, feedback, or need support? We'd love to hear from you.
                </p>

                <div className="bg-stone-900/50 p-8 rounded-2xl border border-white/5 space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
                        <p>
                            For general inquiries and support: <br />
                            <a href="mailto:support@captionbeast.com" className="text-yellow-400 hover:underline">support@captionbeast.com</a>
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Business Inquiries</h3>
                        <p>
                            For partnership opportunities: <br />
                            <a href="mailto:business@captionbeast.com" className="text-yellow-400 hover:underline">business@captionbeast.com</a>
                        </p>
                    </div>
                </div>

                <div className="pt-8">
                    <a href="/" className="text-yellow-400 hover:underline">← Back to Home</a>
                </div>
            </div>
        </main>
    );
}
