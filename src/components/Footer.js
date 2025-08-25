import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, Briefcase, User, Mail, Phone, MapPin, 
  Twitter, Linkedin, Facebook, Instagram, Github,
  Heart, ArrowUp, Shield, HelpCircle, FileText,
  Users, Award, TrendingUp, Globe, Zap,
  Link as LinkIcon, Send, Sparkles,
  Rocket
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribeStatus('success');
      setTimeout(() => {
        setEmail('');
        setSubscribeStatus('');
      }, 3000);
    }
  };

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Discover Startups', href: '/startups', icon: Building },
        { label: 'Find Jobs', href: '/jobs', icon: Briefcase },
        { label: 'Connect', href: '/posts', icon: Users },
        { label: 'Messages', href: '/messages', icon: User },
        { label: 'My Bookmarks', href: '/bookmarks', icon: Award },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', href: '/help', icon: HelpCircle },
        { label: 'My Activity', href: '/activity', icon: TrendingUp },
        { label: 'My Claims', href: '/my-claims', icon: Globe },
        { label: 'Settings', href: '/settings', icon: Zap },
        { label: 'Profile', href: '/profile', icon: User },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/help', icon: null, disabled: true },
        { label: 'Contact', href: '/help', icon: null, disabled: true },
        { label: 'Careers', href: '/help', icon: null, disabled: true },
        { label: 'Press Kit', href: '/help', icon: null, disabled: true },
        { label: 'Partnership', href: '/help', icon: null, disabled: true },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy', icon: Shield },
        { label: 'Terms of Service', href: '/terms', icon: FileText },
        { label: 'Cookie Policy', href: '/help', icon: null, disabled: true },
        { label: 'GDPR', href: '/help', icon: null, disabled: true },
        { label: 'Security', href: '/help', icon: Shield, disabled: true },
      ]
    }
  ];

  const socialLinks = [
    { 
      name: 'Twitter', 
      href: 'https://twitter.com/startlinker', 
      icon: Twitter,
      color: 'hover:text-blue-400 hover:bg-blue-50'
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com/company/startlinker', 
      icon: Linkedin,
      color: 'hover:text-blue-600 hover:bg-blue-50'
    },
    { 
      name: 'Facebook', 
      href: 'https://facebook.com/startlinker', 
      icon: Facebook,
      color: 'hover:text-blue-500 hover:bg-blue-50'
    },
    { 
      name: 'Instagram', 
      href: 'https://instagram.com/startlinker', 
      icon: Instagram,
      color: 'hover:text-pink-500 hover:bg-pink-50'
    },
    { 
      name: 'GitHub', 
      href: 'https://github.com/startlinker', 
      icon: Github,
      color: 'hover:text-gray-700 hover:bg-gray-100'
    }
  ];




  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          
          {/* Enhanced Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <LinkIcon className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Startlinker
                </h2>
              </div>
            </div>
            
            <p className="text-gray-400 mb-6 leading-relaxed">
              Connecting innovative startups with talented professionals. 
              Discover your next opportunity or find the perfect team member 
              to grow your startup.
            </p>

            {/* Contact Info with Icons */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors group">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">hello@startlinker.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors group">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors group">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>

            {/* Enhanced Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${social.color} transition-all duration-200 p-2.5 rounded-xl transform hover:scale-110`}
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links with Hover Effects */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <li key={link.label}>
                      {link.disabled ? (
                        <span className="text-gray-600 cursor-not-allowed text-sm flex items-center space-x-2 opacity-50">
                          {IconComponent && <IconComponent className="w-4 h-4 opacity-30" />}
                          <span>{link.label}</span>
                          <span className="text-xs text-gray-700">(Coming Soon)</span>
                        </span>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2 hover:translate-x-1 duration-200 group"
                        >
                          {IconComponent && <IconComponent className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />}
                          <span>{link.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Enhanced Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-700/50">
          <div className="max-w-md mx-auto text-center lg:max-w-none lg:text-left lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center lg:justify-start">
                <Send className="w-5 h-5 mr-2 text-blue-400" />
                Stay Connected
              </h3>
              <p className="text-gray-400 text-sm">
                Get the latest startup news and job opportunities delivered to your inbox weekly.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <form onSubmit={handleSubscribe} className="sm:flex sm:max-w-md">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-l-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto mt-3 sm:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-r-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  {subscribeStatus === 'success' ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </button>
              </form>
              {subscribeStatus === 'success' && (
                <p className="mt-2 text-sm text-green-400">Thanks for subscribing! Check your inbox.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Enhanced Bottom Bar */}
      <div className="border-t border-gray-700/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span>© {currentYear} Startlinker. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span>for entrepreneurs</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <span>All systems operational</span>
              </div>
              
              <button
                onClick={scrollToTop}
                className="text-gray-400 hover:text-white transition-colors p-2.5 rounded-xl hover:bg-gray-800 group"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;