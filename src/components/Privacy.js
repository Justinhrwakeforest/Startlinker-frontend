import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Database, Share2, Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => {
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
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
                At StartLinker, we value your privacy and are committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, share, and protect your data when you use 
                our platform.
              </p>
              <p className="text-gray-700">
                By using StartLinker, you consent to the data practices described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                2. Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Account information (name, email, username, password)</li>
                <li>Profile information (bio, location, profile picture)</li>
                <li>Startup information (company details, descriptions, contact info)</li>
                <li>Job postings and applications</li>
                <li>Posts, comments, and messages</li>
                <li>Settings and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Information We Collect Automatically</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, clicks)</li>
                <li>Log data (access times, error logs)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (if enabled)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Information from Third Parties</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Social media profile information (if you connect accounts)</li>
                <li>Professional network data</li>
                <li>Public business information</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Provide and maintain our services</li>
                <li>Process user registrations and manage accounts</li>
                <li>Enable startup discovery and job matching</li>
                <li>Facilitate communication between users</li>
                <li>Personalize your experience and recommendations</li>
                <li>Send important notifications and updates</li>
                <li>Analyze usage patterns and improve our platform</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                4. How We Share Your Information
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Public Information</h3>
              <p className="text-gray-700 mb-4">
                Some information is publicly visible on StartLinker, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Your profile information (name, bio, location)</li>
                <li>Startup profiles and job postings</li>
                <li>Public posts and comments</li>
                <li>Ratings and reviews</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Limited Sharing</h3>
              <p className="text-gray-700 mb-4">
                We may share your information in specific circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>With your consent</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who help operate our platform</li>
                <li>In connection with business transfers or acquisitions</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">We Do Not Sell Your Data</h3>
              <p className="text-gray-700 mb-4">
                StartLinker does not sell, rent, or trade your personal information to third parties 
                for their marketing purposes.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                5. Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication</li>
                <li>Secure hosting infrastructure</li>
                <li>Regular backups and disaster recovery</li>
              </ul>
              <p className="text-gray-700">
                While we strive to protect your information, no method of transmission over the internet 
                is 100% secure. We encourage you to use strong passwords and protect your account credentials.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze site usage and performance</li>
                <li>Provide personalized content and recommendations</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="text-gray-700">
                You can control cookies through your browser settings, but disabling them may affect 
                your experience on our platform.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain security and prevent fraud</li>
              </ul>
              <p className="text-gray-700">
                When you delete your account, we will delete or anonymize your personal information 
                within 30 days, except where required by law.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                StartLinker is not intended for use by children under 13 years of age. We do not 
                knowingly collect personal information from children under 13.
              </p>
              <p className="text-gray-700">
                If you believe we have collected information from a child under 13, please contact 
                us immediately so we can remove it.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance with 
                this Privacy Policy.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of significant 
                changes by posting the new Privacy Policy on our platform and updating the "Last updated" date.
              </p>
              <p className="text-gray-700">
                We encourage you to review this Privacy Policy periodically to stay informed about 
                how we protect your information.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                12. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>Email: privacy@startlinker.dev</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Data Protection Officer: dpo@startlinker.dev</span>
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <section className="mb-8 border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Link to="/terms" className="text-blue-600 hover:text-blue-700 block">
                  Terms of Service
                </Link>
                <Link to="/settings" className="text-blue-600 hover:text-blue-700 block">
                  Account Settings
                </Link>
                <Link to="/help" className="text-blue-600 hover:text-blue-700 block">
                  Help Center
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;