import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb, 
  FileText, 
  Rocket, 
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Send,
  Download,
  Play,
  Star,
  Award,
  Zap
} from 'lucide-react';

const StartupGuide = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    // Business Basics
    businessName: '',
    industry: '',
    businessModel: '',
    stage: '',
    
    // Problem & Solution
    problemStatement: '',
    solution: '',
    targetMarket: '',
    uniqueValue: '',
    
    // Team & Contact
    founderName: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    teamSize: '',
    
    // Funding & Goals
    fundingNeeds: '',
    currentFunding: '',
    revenue: '',
    goals: '',
    
    // Additional Info
    additionalInfo: '',
    newsletter: false
  });

  const steps = [
    {
      id: 1,
      title: 'Business Basics',
      description: 'Tell us about your startup',
      icon: Building,
      fields: ['businessName', 'industry', 'businessModel', 'stage']
    },
    {
      id: 2,
      title: 'Problem & Solution',
      description: 'What problem are you solving?',
      icon: Lightbulb,
      fields: ['problemStatement', 'solution', 'targetMarket', 'uniqueValue']
    },
    {
      id: 3,
      title: 'Team & Contact',
      description: 'Who are the key players?',
      icon: Users,
      fields: ['founderName', 'email', 'phone', 'website', 'location', 'teamSize']
    },
    {
      id: 4,
      title: 'Funding & Goals',
      description: 'Your financial landscape',
      icon: DollarSign,
      fields: ['fundingNeeds', 'currentFunding', 'revenue', 'goals']
    },
    {
      id: 5,
      title: 'Final Details',
      description: 'Additional information',
      icon: FileText,
      fields: ['additionalInfo', 'newsletter']
    }
  ];

  const businessModels = [
    'B2B (Business to Business)',
    'B2C (Business to Consumer)',
    'B2B2C (Business to Business to Consumer)',
    'Marketplace',
    'SaaS (Software as a Service)',
    'E-commerce',
    'Subscription',
    'Freemium',
    'Platform',
    'Other'
  ];

  const startupStages = [
    'Idea Stage',
    'Pre-Seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C+',
    'IPO Ready',
    'Established'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Energy',
    'Transportation',
    'Real Estate',
    'Food & Beverage',
    'Entertainment',
    'Agriculture',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepComplete = (step) => {
    const stepFields = steps.find(s => s.id === step)?.fields || [];
    return stepFields.every(field => {
      if (field === 'newsletter') return true; // Optional field
      return formData[field] && formData[field].trim() !== '';
    });
  };

  const handleNext = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate a comprehensive startup guide PDF or summary
    const guideContent = generateStartupGuide(formData);
    
    // You could also send this data to your backend
    console.log('Startup Guide Data:', formData);
    
    // Show success message or navigate to a thank you page
    alert('Your startup guide has been generated! Check your email for the complete guide.');
  };

  const generateStartupGuide = (data) => {
    // This could generate a PDF or comprehensive guide based on the form data
    // For now, we'll just return the structured data
    return {
      businessPlan: {
        executive_summary: `${data.businessName} is a ${data.industry} startup in the ${data.stage} stage, solving ${data.problemStatement} through ${data.solution}.`,
        market_analysis: `Our target market consists of ${data.targetMarket}.`,
        unique_value_proposition: data.uniqueValue,
        team: `Led by ${data.founderName} with a team of ${data.teamSize} people.`,
        funding_requirements: data.fundingNeeds,
        business_model: data.businessModel,
        location: data.location,
        website: data.website,
        goals: data.goals
      }
    };
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Basics</h3>
              <p className="text-gray-600">Let's start with the fundamentals of your startup</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your startup name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Model *
                </label>
                <select
                  value={formData.businessModel}
                  onChange={(e) => handleInputChange('businessModel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select business model</option>
                  {businessModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Stage *
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleInputChange('stage', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select current stage</option>
                  {startupStages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Lightbulb className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Problem & Solution</h3>
              <p className="text-gray-600">Define the problem you're solving and your unique approach</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Problem Statement *
                </label>
                <textarea
                  value={formData.problemStatement}
                  onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What specific problem does your startup solve?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Solution *
                </label>
                <textarea
                  value={formData.solution}
                  onChange={(e) => handleInputChange('solution', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How does your startup solve this problem?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Market *
                </label>
                <textarea
                  value={formData.targetMarket}
                  onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Who is your ideal customer? Describe your target audience."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unique Value Proposition *
                </label>
                <textarea
                  value={formData.uniqueValue}
                  onChange={(e) => handleInputChange('uniqueValue', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What makes your solution unique? Why choose you over competitors?"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Team & Contact</h3>
              <p className="text-gray-600">Tell us about your team and how to reach you</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Founder Name *
                </label>
                <input
                  type="text"
                  value={formData.founderName}
                  onChange={(e) => handleInputChange('founderName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Primary founder name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team Size *
                </label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select team size</option>
                  <option value="Solo founder">Solo founder</option>
                  <option value="2-5 people">2-5 people</option>
                  <option value="6-10 people">6-10 people</option>
                  <option value="11-25 people">11-25 people</option>
                  <option value="26-50 people">26-50 people</option>
                  <option value="50+ people">50+ people</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website *
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City, State/Country"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <DollarSign className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Funding & Goals</h3>
              <p className="text-gray-600">Share your financial needs and objectives</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Funding Needs *
                </label>
                <select
                  value={formData.fundingNeeds}
                  onChange={(e) => handleInputChange('fundingNeeds', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select funding needs</option>
                  <option value="No funding needed">No funding needed</option>
                  <option value="Under $50K">Under $50K</option>
                  <option value="$50K - $250K">$50K - $250K</option>
                  <option value="$250K - $1M">$250K - $1M</option>
                  <option value="$1M - $5M">$1M - $5M</option>
                  <option value="$5M - $10M">$5M - $10M</option>
                  <option value="$10M+">$10M+</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Funding Status *
                </label>
                <select
                  value={formData.currentFunding}
                  onChange={(e) => handleInputChange('currentFunding', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select current funding</option>
                  <option value="Self-funded">Self-funded</option>
                  <option value="Friends & Family">Friends & Family</option>
                  <option value="Angel Investment">Angel Investment</option>
                  <option value="VC Funded">VC Funded</option>
                  <option value="Crowdfunding">Crowdfunding</option>
                  <option value="Government Grant">Government Grant</option>
                  <option value="Revenue Funded">Revenue Funded</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Revenue Status *
                </label>
                <select
                  value={formData.revenue}
                  onChange={(e) => handleInputChange('revenue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select revenue status</option>
                  <option value="Pre-revenue">Pre-revenue</option>
                  <option value="Under $10K/month">Under $10K/month</option>
                  <option value="$10K - $50K/month">$10K - $50K/month</option>
                  <option value="$50K - $100K/month">$50K - $100K/month</option>
                  <option value="$100K - $500K/month">$100K - $500K/month</option>
                  <option value="$500K+/month">$500K+/month</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Goals for Next 12 Months *
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What are your key objectives and milestones for the next year?"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Final Details</h3>
              <p className="text-gray-600">Any additional information to complete your guide</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any other details about your startup, challenges, achievements, or specific areas where you need guidance?"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={formData.newsletter}
                    onChange={(e) => handleInputChange('newsletter', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="newsletter" className="text-sm font-medium text-blue-900">
                      Subscribe to StartLinker Newsletter
                    </label>
                    <p className="text-xs text-blue-700 mt-1">
                      Get weekly insights, startup resources, funding opportunities, and success stories delivered to your inbox.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Rocket className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-900">What You'll Receive</h4>
                </div>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Personalized startup roadmap based on your stage</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Industry-specific resources and best practices</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Funding strategy recommendations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Marketing and growth tactics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Legal and compliance checklist</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Network recommendations and partnership opportunities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Startup Guide Form</h1>
              <p className="text-gray-600 mt-1">Get personalized guidance for your startup journey</p>
            </div>
            <button
              onClick={() => navigate('/startups')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back to Startups
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = step.id === activeStep;
              const isCompleted = step.id < activeStep || (step.id === activeStep && isStepComplete(step.id));
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-100 border-green-500 text-green-600'
                        : isActive
                        ? 'bg-blue-100 border-blue-500 text-blue-600'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all duration-300 ${
                        step.id < activeStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              Step {activeStep} of {steps.length}: {steps[activeStep - 1]?.title}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {steps[activeStep - 1]?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={activeStep === 1}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white border border-gray-300 hover:border-gray-400'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{activeStep} of {steps.length}</span>
            </div>
            
            {activeStep === steps.length ? (
              <button
                type="submit"
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Generate My Guide
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepComplete(activeStep)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  !isStepComplete(activeStep)
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Footer with Benefits */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Why Use Our Startup Guide?</h2>
            <p className="text-gray-600">Join thousands of entrepreneurs who have accelerated their success</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <Star className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Roadmap</h3>
              <p className="text-gray-600 text-sm">Get a custom action plan based on your specific stage and industry</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Insights</h3>
              <p className="text-gray-600 text-sm">Access proven strategies from successful entrepreneurs and VCs</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Results</h3>
              <p className="text-gray-600 text-sm">Receive your comprehensive guide instantly upon completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupGuide;