import React from 'react';
import { ArrowLeft, FileText, Shield, AlertCircle, Users, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to StartLinker
          </Link>
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to StartLinker. These Terms of Service ("Terms") govern your use of our platform, 
                including our website, services, and applications (collectively, the "Service"). By accessing 
                or using StartLinker, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700">
                If you do not agree to these Terms, please do not use our Service.
              </p>
            </section>

            {/* Acceptance */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By creating an account or using our Service, you confirm that:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>You are at least 18 years old or have parental consent</li>
                <li>You have the legal capacity to enter into these Terms</li>
                <li>You will comply with all applicable laws and regulations</li>
                <li>The information you provide is accurate and complete</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of StartLinker, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and up-to-date information</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            {/* Platform Use */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Platform Use</h2>
              <p className="text-gray-700 mb-4">
                StartLinker provides a platform for startup discovery, job postings, and community discussions. 
                When using our Service, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Use the platform for lawful purposes only</li>
                <li>Respect the rights and privacy of other users</li>
                <li>Not post false, misleading, or defamatory content</li>
                <li>Not engage in spam, harassment, or abusive behavior</li>
                <li>Not attempt to circumvent security measures</li>
              </ul>
            </section>

            {/* Content Guidelines */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Content Guidelines</h2>
              <p className="text-gray-700 mb-4">
                Users may submit content including startup profiles, job postings, and comments. 
                All content must:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Be truthful and accurate</li>
                <li>Not violate intellectual property rights</li>
                <li>Not contain malicious code or links</li>
                <li>Comply with applicable laws and regulations</li>
                <li>Be appropriate for a professional audience</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to remove content that violates these guidelines.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                StartLinker and its content are protected by copyright, trademark, and other intellectual 
                property laws. You retain ownership of content you submit, but grant us a license to use, 
                modify, and display it on our platform.
              </p>
              <p className="text-gray-700">
                You may not copy, modify, distribute, or create derivative works of our platform without 
                explicit permission.
              </p>
            </section>

            {/* Privacy */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy to understand how we 
                collect, use, and protect your information.
              </p>
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                Read our Privacy Policy →
              </Link>
            </section>

            {/* Disclaimers */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
              <p className="text-gray-700 mb-4">
                StartLinker is provided "as is" without warranties of any kind. We disclaim all warranties, 
                express or implied, including warranties of merchantability, fitness for a particular purpose, 
                and non-infringement.
              </p>
              <p className="text-gray-700">
                We do not guarantee the accuracy, completeness, or reliability of user-generated content 
                or third-party information.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, StartLinker shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
              <p className="text-gray-700">
                Our total liability for any claim shall not exceed the amount you paid us in the 12 months 
                preceding the claim.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account at any time for violations of these Terms or for 
                any other reason. You may also terminate your account at any time through your account settings.
              </p>
              <p className="text-gray-700">
                Upon termination, your right to use the Service ceases immediately.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms from time to time. We will notify you of significant changes 
                by posting the new Terms on our platform and updating the "Last updated" date.
              </p>
              <p className="text-gray-700">
                Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="flex items-center text-gray-700">
                <Mail className="h-4 w-4 mr-2" />
                <span>legal@startlinker.dev</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;