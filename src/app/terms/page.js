import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-10 opacity-95 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo className="w-8 h-8 text-indigo-600" />
                        <span className="font-black text-xl text-slate-900 tracking-tight">Waitly</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 py-12 px-6">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Terms of Service</h1>
                    <p className="text-slate-500 mb-8">Last updated: December 31, 2024</p>

                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p>
                            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Waitly website and application (the "Service") operated by Waitly ("us", "we", or "our").
                        </p>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">1. Acceptance of Terms</h3>
                        <p>
                            Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service you agree to be bound by these Terms.
                        </p>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">2. Description of Service</h3>
                        <p>
                            Waitly provides a digital queue management system designed to allow businesses to manage customer queues and for users to join these queues remotely.
                        </p>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">3. User Accounts</h3>
                        <p>
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 my-4">
                            <li>You are responsible for safeguarding the password that you use to access the Service.</li>
                            <li>You verify that you are at least 13 years of age.</li>
                        </ul>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">4. Business Responsibilities</h3>
                        <p>
                            If you use the Service as a Vendor (Business):
                        </p>
                        <ul className="list-disc pl-5 space-y-2 my-4">
                            <li>You agree to use the Service specifically to manage real-world customer queues.</li>
                            <li>You are responsible for the accuracy of wait times listed on your profile.</li>
                            <li>You agree not to misuse customer data obtained through the Service for unsolicited marketing.</li>
                        </ul>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">5. Limitation of Availability</h3>
                        <p>
                            We guarantee 99.9% uptime for our Enterprise plans. For standard plans, while we strive for constant availability, we are not liable for any downtime or data loss caused by routine maintenance or unforeseen technical issues.
                        </p>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">6. Termination</h3>
                        <p>
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">7. Changes</h3>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
                        </p>

                        <h3 className="text-indigo-900 mt-8 mb-4 font-bold text-lg">8. Contact Us</h3>
                        <p>
                            If you have any questions about these Terms, please contact us at: <a href="mailto:waitly2022@gmail.com" className="text-indigo-600 hover:text-indigo-800 font-medium">waitly2022@gmail.com</a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Waitly. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
