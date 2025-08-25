// src/components/Welcome.js - Premium Welcome Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { 
  ArrowRight, Building, Briefcase, Users, Rocket, Zap, Award, 
  TrendingUp, Star, MessageCircle, Search, CheckCircle, 
  Globe, Target, Lightbulb, Network, Shield, Crown,
  ChevronRight, Heart, Eye, UserPlus, Calendar
} from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_startups: 0,
    total_jobs: 0,
    total_users: 0,
    total_connections: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    // Fetch real stats from API
    fetchStats();
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/stats/');
      if (response.ok) {
        const data = await response.json();
        setStats({
          total_startups: data.total_startups || 150,
          total_jobs: data.total_jobs || 2500,
          total_users: data.total_users || 15000,
          total_connections: data.total_connections || 45000
        });
      }
    } catch (error) {
      // Fallback to mock data
      setStats({
        total_startups: 150,
        total_jobs: 2500,
        total_users: 15000,
        total_connections: 45000
      });
    }
  };

  const features = [
    {
      icon: Building,
      title: "Discover Startups",
      description: "Explore innovative companies and investment opportunities",
      color: "from-blue-500 to-purple-600",
      path: "/startups"
    },
    {
      icon: Briefcase,
      title: "Find Dream Jobs",
      description: "Connect with exciting career opportunities at top startups",
      color: "from-green-500 to-teal-600",
      path: "/jobs"
    },
    {
      icon: MessageCircle,
      title: "Connect & Network",
      description: "Build meaningful relationships with founders and professionals",
      color: "from-purple-500 to-pink-600",
      path: "/posts"
    },
    {
      icon: Rocket,
      title: "Launch Your Vision",
      description: "Share your startup and attract talent, investors, and users",
      color: "from-orange-500 to-red-600",
      path: "/startups/new"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Verified Community",
      description: "Connect with authentic startups and professionals"
    },
    {
      icon: Crown,
      title: "Premium Features",
      description: "Advanced analytics, priority support, and exclusive content"
    },
    {
      icon: Network,
      title: "Smart Matching",
      description: "AI-powered recommendations for jobs, startups, and connections"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access opportunities worldwide with local insights"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Founder, TechFlow",
      avatar: "https://ui-avatars.com/?name=Sarah+Chen&background=3b82f6&color=fff&size=48",
      quote: "StartLinker helped me find the perfect co-founder and our first key employees. Game-changer!"
    },
    {
      name: "Michael Rodriguez", 
      role: "Senior Developer, InnovateLab",
      avatar: "https://ui-avatars.com/?name=Michael+Rodriguez&background=10b981&color=fff&size=48",
      quote: "Found my dream job at a Series A startup. The matching algorithm is incredibly accurate."
    },
    {
      name: "Emily Thompson",
      role: "Product Manager, GrowthCorp",
      avatar: "https://ui-avatars.com/?name=Emily+Thompson&background=f59e0b&color=fff&size=48",
      quote: "The networking features opened doors I never knew existed. My career transformed completely."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="navbar-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  StartLinker
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Innovation Ecosystem</p>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/auth"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-semibold mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <Zap className="w-4 h-4 mr-2" />
              Join 15,000+ Innovators Worldwide
            </div>

            {/* Main Headline */}
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              Where 
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> Innovation </span>
              Meets 
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent"> Opportunity</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              Connect with groundbreaking startups, discover your next career move, and build the network that will define your future in the innovation economy.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <Link
                to="/auth"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 flex items-center"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/startups"
                className="group bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
              >
                Explore Startups
                <Building className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto transform transition-all duration-1000 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              {[
                { label: 'Startups', value: stats.total_startups, icon: Building },
                { label: 'Jobs', value: stats.total_jobs, icon: Briefcase },
                { label: 'Members', value: stats.total_users, icon: Users },
                { label: 'Connections', value: stats.total_connections, icon: Heart }
              ].map(({ label, value, icon: Icon }, index) => (
                <div key={label} className="text-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                    <Icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {value.toLocaleString()}+
                    </div>
                    <div className="text-gray-600 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From discovering the next unicorn to landing your dream job, StartLinker provides the tools and connections you need.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Cards */}
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = index === activeFeature;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg scale-105' 
                        : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setActiveFeature(index);
                      // Navigate to auth first, then redirect to the feature after login
                      navigate('/auth', { state: { redirectTo: feature.path } });
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Visualization */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 shadow-xl">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">TechFlow AI</div>
                        <div className="text-sm text-gray-600">Series A • $15M raised</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <Briefcase className="w-6 h-6 text-green-600 mb-2" />
                      <div className="text-sm font-medium text-gray-900">Senior Dev</div>
                      <div className="text-xs text-gray-600">$120k - $180k</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <Users className="w-6 h-6 text-purple-600 mb-2" />
                      <div className="text-sm font-medium text-gray-900">50+ Members</div>
                      <div className="text-xs text-gray-600">Growing team</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why Choose 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> StartLinker?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the most trusted platform for startup ecosystem connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="group h-full">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 h-full flex flex-col">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                    <p className="text-gray-600 flex-grow">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Trusted by Innovators
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              See how StartLinker has transformed careers and launched successful ventures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-blue-200 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <blockquote className="text-white/90 italic">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Future?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of innovators who are already building tomorrow, today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/auth"
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 flex items-center"
            >
              Get Started for Free
              <Rocket className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-gray-400 mt-8 text-sm">
            No credit card required • Join in 30 seconds • Start connecting immediately
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 lg:mb-0">
              <Logo className="w-10 h-10" />
              <div>
                <h3 className="text-xl font-bold text-white">StartLinker</h3>
                <p className="text-gray-400 text-sm">Innovation Ecosystem</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-end gap-8 text-gray-400">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/help" className="hover:text-white transition-colors">Help</Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500">
              © 2025 StartLinker. All rights reserved. Building the future of innovation, one connection at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;