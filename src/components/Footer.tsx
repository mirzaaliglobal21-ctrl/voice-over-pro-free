import React, { useState } from 'react';
import { Shield, Mail, FileText, X, Mic2, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const closeModal = () => {
    setModalType(null);
    setContactSubmitted(false);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage) return;
    setContactSubmitted(true);
    setTimeout(() => {
      closeModal();
      setContactMessage('');
      setContactEmail('');
    }, 2000);
  };

  return (
    <>
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand & info */}
            <div className="flex items-center gap-3 text-left">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                <Mic2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  VoiceOver Pro
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  High-fidelity neural text-to-speech powered by Gemini AI
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setModalType('privacy')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setModalType('terms')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setModalType('contact')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact & Support</span>
              </button>
            </div>

            {/* Copyright */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} VoiceOver Pro. Built with Gemini AI.
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Dialog for Privacy / Terms / Contact */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[85vh] overflow-y-auto text-left">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {modalType === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Privacy Policy
                  </h3>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    VoiceOver Pro respects your privacy. Your submitted text scripts are transmitted
                    securely to the server and processed by the Google Gemini TTS API strictly for generating
                    voiceover audio.
                  </p>
                  <p>
                    <strong>Data Storage:</strong> Session history and preference settings (such as dark mode and selected voices)
                    are stored locally inside your browser (Local Storage) and are not retained on our servers.
                  </p>
                  <p>
                    <strong>No Audio Logging:</strong> Generated audio files are created in-memory and converted to standard WAV format.
                    We do not store or sell your custom voiceover recordings.
                  </p>
                </div>
              </div>
            )}

            {modalType === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Terms of Service
                  </h3>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    By using VoiceOver Pro, you agree to synthesize content in accordance with fair-use and ethical AI policies:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                    <li>Do not generate harmful, illegal, defamatory, or abusive material.</li>
                    <li>Do not impersonate private individuals without explicit consent.</li>
                    <li>
                      Commercial and non-commercial productions created with VoiceOver Pro are permitted
                      under applicable Google Gemini API terms.
                    </li>
                  </ul>
                  <p>
                    The service is provided "as is" with high-fidelity speech synthesis capabilities.
                  </p>
                </div>
              </div>
            )}

            {modalType === 'contact' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Mail className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Contact & Feedback (رابطہ کریں)
                  </h3>
                </div>

                {contactSubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs text-center font-medium">
                    Thank you! Your feedback has been received.
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Have suggestions, need custom accents, or encountered an issue? Let us know!
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Message / آپ کا پیغام
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell us what you think or what features you'd like to see..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-98"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
