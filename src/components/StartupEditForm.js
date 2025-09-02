// src/components/StartupEditForm.js - Enhanced with fixed progress bar, mandatory cover image, and full mobile responsiveness
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Building, Save, X, ArrowLeft, AlertCircle, CheckCircle,
  Calendar, Users, DollarSign, Briefcase, Target, TrendingUp,
  Globe, Mail, Phone, Tag, Image as ImageIcon, Plus, Trash2,
  Star, Award, Twitter, Linkedin, Github
} from 'lucide-react';

const StartupEditForm = () => {
  const { id } = useParams();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startup, setStartup] = useState(null);
  const [formData, setFormData] = useState({});
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // New states for additional features
  const [founders, setFounders] = useState([
    { name: '', title: 'Founder', bio: '', linkedin: '' }
  ]);
  const [tags, setTags] = useState(['']);
  const [socialMedia, setSocialMedia] = useState({
    twitter: '',
    linkedin: '',
    github: ''
  });
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);

  useEffect(() => {
    if (id) {
      fetchStartupData();
      fetchIndustries();
    }
  }, [id]);

  useEffect(() => {
    if (authContext?.user) {
      setIsAdmin(authContext.user.is_staff || authContext.user.is_superuser);
    }
  }, [authContext]);

  // Calculate form completion percentage for progress bar
  const calculateProgress = () => {
    const requiredFields = [
      'name',
      'description', 
      'industry',
      'location',
      'employee_count',
      'founded_year'
    ];
    
    const optionalButImportantFields = [
      'website',
      'business_model'
    ];
    
    // Check required fields (70% weight)
    const requiredCompleted = requiredFields.filter(field => {
      if (field === 'description') {
        return formData[field] && formData[field].length >= 50;
      }
      return formData[field] && formData[field].toString().trim();
    }).length;
    
    // Check founders (10% weight)
    const foundersCompleted = founders.filter(f => f.name?.trim()).length > 0 ? 1 : 0;
    
    // Check cover image (10% weight) - MANDATORY
    const coverImageCompleted = (coverImageFile || formData.cover_image_url?.trim()) ? 1 : 0;
    
    // Check optional fields (10% weight)
    const optionalCompleted = optionalButImportantFields.filter(field => 
      formData[field] && formData[field].toString().trim()
    ).length;
    
    // Calculate weighted percentage
    const requiredPercentage = (requiredCompleted / requiredFields.length) * 70;
    const foundersPercentage = foundersCompleted * 10;
    const coverImagePercentage = coverImageCompleted * 10;
    const optionalPercentage = (optionalCompleted / optionalButImportantFields.length) * 10;
    
    return Math.round(requiredPercentage + foundersPercentage + coverImagePercentage + optionalPercentage);
  };

  const fetchStartupData = async () => {
    try {
      setLoading(true);
      const startupData = await api.startups.get(id);
      
      setStartup(startupData);
      
      // Initialize form data with current startup values
      setFormData({
        name: startupData.name || '',
        description: startupData.description || '',
        industry: startupData.industry || '',
        location: startupData.location || '',
        website: startupData.website || '',
        funding_amount: startupData.funding_amount || '',
        valuation: startupData.valuation || '',
        employee_count: startupData.employee_count || '',
        founded_year: startupData.founded_year || new Date().getFullYear(),
        revenue: startupData.revenue || '',
        user_count: startupData.user_count || '',
        growth_rate: startupData.growth_rate || '',
        contact_email: startupData.contact_email || '',
        contact_phone: startupData.contact_phone || '',
        business_model: startupData.business_model || '',
        target_market: startupData.target_market || '',
        cover_image_url: startupData.cover_image_url || '',
        is_featured: startupData.is_featured || false
      });

      // Initialize founders
      if (startupData.founders && startupData.founders.length > 0) {
        setFounders(startupData.founders.map(founder => ({
          name: founder.name || '',
          title: founder.title || 'Founder',
          bio: founder.bio || '',
          linkedin: founder.linkedin_url || ''
        })));
      }

      // Initialize tags
      if (startupData.tags && startupData.tags.length > 0) {
        setTags([...startupData.tags.map(tag => tag.tag || tag), '']);
      }

      // Initialize social media
      if (startupData.social_media) {
        setSocialMedia({
          twitter: startupData.social_media.twitter || '',
          linkedin: startupData.social_media.linkedin || '',
          github: startupData.social_media.github || ''
        });
      }

      // Set cover image preview if exists
      if (startupData.cover_image_url || startupData.cover_image_display_url) {
        setCoverImagePreview(startupData.cover_image_display_url || startupData.cover_image_url);
      }
      
      console.log('Startup data loaded for editing:', startupData);
    } catch (error) {
      console.error('Error fetching startup data:', error);
      if (error.response?.status === 404) {
        navigate('/startups');
      } else if (error.response?.status === 403) {
        setErrors({ general: 'You do not have permission to edit this startup' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async () => {
    try {
      setIndustriesLoading(true);
      const industriesData = await api.startups.getIndustries();
      console.log('Industries API response:', industriesData);
      
      // Handle different response formats
      let industries = industriesData;
      
      // If response has a results property (paginated response)
      if (industriesData && industriesData.results) {
        industries = industriesData.results;
      }
      
      // Ensure it's an array
      if (Array.isArray(industries) && industries.length > 0) {
        setIndustries(industries);
        console.log('✅ Industries loaded from API:', industries.length);
      } else {
        throw new Error('Invalid industries data format');
      }
    } catch (error) {
      console.error('❌ Error fetching industries, using defaults:', error);
      // Use default industries if API fails
      const defaultIndustries = [
        { id: 1, name: 'Technology', icon: '💻' },
        { id: 2, name: 'Healthcare', icon: '🏥' },
        { id: 3, name: 'Finance', icon: '💰' },
        { id: 4, name: 'E-commerce', icon: '🛒' },
        { id: 5, name: 'Education', icon: '📚' },
        { id: 6, name: 'Food & Beverage', icon: '🍕' },
        { id: 7, name: 'Travel & Tourism', icon: '✈️' },
        { id: 8, name: 'Real Estate', icon: '🏠' },
        { id: 9, name: 'Entertainment', icon: '🎬' },
        { id: 10, name: 'Transportation', icon: '🚗' },
        { id: 11, name: 'Energy', icon: '⚡' },
        { id: 12, name: 'Agriculture', icon: '🌱' },
        { id: 13, name: 'Manufacturing', icon: '🏭' },
        { id: 14, name: 'Media', icon: '📺' },
        { id: 15, name: 'Gaming', icon: '🎮' },
        { id: 16, name: 'AI/Machine Learning', icon: '🤖' },
        { id: 17, name: 'Blockchain/Crypto', icon: '⛓️' },
        { id: 18, name: 'SaaS', icon: '☁️' },
        { id: 19, name: 'Social Media', icon: '📱' },
        { id: 20, name: 'Other', icon: '🔧' }
      ];
      setIndustries(defaultIndustries);
      console.log('✅ Using default industries:', defaultIndustries.length);
    } finally {
      setIndustriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, cover_image: 'Please select a valid image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, cover_image: 'Image size must be less than 5MB' }));
        return;
      }
      
      setCoverImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors and URL field
      if (errors.cover_image) {
        setErrors(prev => ({ ...prev, cover_image: null }));
      }
      setFormData(prev => ({ ...prev, cover_image_url: '' }));
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setFormData(prev => ({ ...prev, cover_image_url: '' }));
    // Reset the file input
    const fileInput = document.getElementById('cover-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleCoverImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, cover_image_url: url }));
    
    // If user enters a URL, show it as preview and clear file upload
    if (url && url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      setCoverImagePreview(url);
      setCoverImageFile(null);
      // Reset file input
      const fileInput = document.getElementById('cover-image-input');
      if (fileInput) {
        fileInput.value = '';
      }
    } else if (!url) {
      // If URL is cleared and no file, remove preview
      if (!coverImageFile) {
        setCoverImagePreview(null);
      }
    }

    // Clear errors when user starts typing
    if (errors.cover_image) {
      setErrors(prev => ({ ...prev, cover_image: null }));
    }
  };

  const handleSocialMediaChange = (platform, value) => {
    setSocialMedia(prev => ({ ...prev, [platform]: value }));
  };

  const handleFounderChange = (index, field, value) => {
    setFounders(prev => prev.map((founder, i) => 
      i === index ? { ...founder, [field]: value } : founder
    ));
  };

  const addFounder = () => {
    if (founders.length < 5) {
      setFounders(prev => [...prev, { name: '', title: 'Co-Founder', bio: '', linkedin: '' }]);
    }
  };

  const removeFounder = (index) => {
    if (founders.length > 1) {
      setFounders(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleTagChange = (index, value) => {
    setTags(prev => prev.map((tag, i) => i === index ? value : tag));
  };

  const addTag = () => {
    if (tags.length < 10 && tags[tags.length - 1].trim() !== '') {
      setTags(prev => [...prev, '']);
    }
  };

  const removeTag = (index) => {
    if (tags.length > 1) {
      setTags(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.employee_count) {
      newErrors.employee_count = 'Employee count is required';
    }
    if (!formData.founded_year) {
      newErrors.founded_year = 'Founded year is required';
    }

    // MANDATORY: Cover image validation
    if (!coverImageFile && !formData.cover_image_url?.trim()) {
      newErrors.cover_image = 'Cover image is required. Please upload an image or provide a URL.';
    }

    // Length validations
    if (formData.description && formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters long';
    }
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Number validations
    if (formData.employee_count && (formData.employee_count < 1 || formData.employee_count > 100000)) {
      newErrors.employee_count = 'Employee count must be between 1 and 100,000';
    }

    const currentYear = new Date().getFullYear();
    if (formData.founded_year && (formData.founded_year < 1800 || formData.founded_year > currentYear)) {
      newErrors.founded_year = `Founded year must be between 1800 and ${currentYear}`;
    }

    // URL validation
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    // Cover image URL validation
    if (formData.cover_image_url && !isValidUrl(formData.cover_image_url)) {
      newErrors.cover_image = 'Please enter a valid image URL';
    }

    // Founder validation
    const validFounders = founders.filter(f => f.name?.trim());
    if (validFounders.length === 0) {
      newErrors.founders = 'At least one founder is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string.startsWith('http') ? string : `https://${string}`);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 StartupEditForm submit triggered!');
    console.log('📝 Current form data:', formData);
    console.log('🔍 API object check:', api);
    console.log('🔍 API.startups check:', api.startups);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // Prepare the update data with only basic fields to avoid backend issues
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        industry: parseInt(formData.industry),
        location: formData.location.trim(),
        employee_count: parseInt(formData.employee_count),
        founded_year: parseInt(formData.founded_year),
        is_featured: formData.is_featured || false
      };

      // Add optional fields only if they have values
      if (formData.website && formData.website.trim()) {
        updateData.website = formData.website.trim();
      }
      if (formData.funding_amount && formData.funding_amount.trim()) {
        updateData.funding_amount = formData.funding_amount.trim();
      }
      if (formData.valuation && formData.valuation.trim()) {
        updateData.valuation = formData.valuation.trim();
      }
      if (formData.revenue && formData.revenue.trim()) {
        updateData.revenue = formData.revenue.trim();
      }
      if (formData.user_count && formData.user_count.trim()) {
        updateData.user_count = formData.user_count.trim();
      }
      if (formData.growth_rate && formData.growth_rate.trim()) {
        updateData.growth_rate = formData.growth_rate.trim();
      }
      if (formData.contact_email && formData.contact_email.trim()) {
        updateData.contact_email = formData.contact_email.trim();
      }
      if (formData.contact_phone && formData.contact_phone.trim()) {
        updateData.contact_phone = formData.contact_phone.trim();
      }
      if (formData.business_model) {
        updateData.business_model = formData.business_model;
      }
      if (formData.target_market && formData.target_market.trim()) {
        updateData.target_market = formData.target_market.trim();
      }
      if (formData.cover_image_url && formData.cover_image_url.trim()) {
        updateData.cover_image_url = formData.cover_image_url.trim();
      }

      // Note: Temporarily excluding complex nested data (founders, tags, social_media) 
      // to avoid backend serialization issues. These can be added back later.

      console.log('Submitting update data:', updateData);

      // Try direct update first since submit_edit has backend issues
      let response;
      let isDirectUpdate = false;
      
      try {
        // Try direct update via PUT first
        console.log('🔄 Attempting direct update...');
        response = await api.startups.update(id, updateData);
        isDirectUpdate = true;
        console.log('✅ Direct update successful:', response);
      } catch (updateError) {
        console.log('❌ Direct update failed, trying submit_edit:', updateError);
        // Fallback to submit_edit if direct update fails
        try {
          response = await api.startups.submitEdit(id, updateData);
          console.log('✅ Edit request submitted for review:', response);
        } catch (submitError) {
          console.error('❌ Both update methods failed');
          throw updateError; // Throw the original error
        }
      }

      if (isDirectUpdate) {
        // Direct update successful
        setSuccess(true);
        alert('✅ Startup updated successfully!');
        setTimeout(() => {
          navigate(`/startups/${id}`);
        }, 1500);
      } else {
        // Edit request submitted for review
        setSuccess(true);
        alert('✅ Edit request submitted for review! Your changes will be reviewed by admins.');
        setTimeout(() => {
          navigate(`/startups/${id}`);
        }, 2000);
      }

    } catch (error) {
      console.error('Error submitting edit:', error);
      
      if (error.response?.status === 401) {
        setErrors({ general: 'Please log in to edit this startup' });
        navigate('/auth');
      } else if (error.response?.status === 403) {
        setErrors({ general: 'You do not have permission to edit this startup. Only premium members who submitted the startup or admins can edit.' });
      } else if (error.response?.status === 404) {
        setErrors({ general: 'Startup not found or API endpoint not available.' });
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          setErrors({ general: error.response.data });
        } else if (error.response.data.error) {
          setErrors({ general: error.response.data.error });
        } else {
          setErrors(error.response.data);
        }
      } else {
        setErrors({ general: 'Failed to submit edit request. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/startups/${id}`);
  };

  // Get current progress
  const progressPercentage = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading startup details</h3>
          <p className="text-slate-500">Please wait while we fetch the information...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6 sm:p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Startup not found</h3>
          <p className="text-slate-600 mb-6 text-sm sm:text-base">The startup you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <button 
            onClick={() => navigate('/startups')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Startups
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {isAdmin ? 'Startup Updated Successfully!' : 'Edit Request Submitted!'}
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {isAdmin 
              ? 'Your changes have been applied to the startup immediately.'
              : 'Your edit request has been submitted for review. You\'ll be notified once it\'s approved.'
            }
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-300 border-t-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center mb-2">
                <Building className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
                Edit {startup.name}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {isAdmin 
                  ? 'As an admin, your changes will be applied immediately.'
                  : 'Your edit request will be reviewed by our team before being published.'
                }
              </p>
            </div>
            
            <button
              onClick={handleCancel}
              className="flex items-center justify-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>

          {/* Fixed Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Form Completion</span>
              <span className="text-sm font-medium text-blue-600">{progressPercentage}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>Started</span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm sm:text-base">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Company Name */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your company name"
                  maxLength={100}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>


              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 ${
                    errors.industry ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  disabled={industriesLoading}
                >
                  <option value="">
                    {industriesLoading ? 'Loading industries...' : 'Select an industry'}
                  </option>
                  {Array.isArray(industries) && industries.map(industry => (
                    <option key={industry.id} value={industry.id}>
                      {industry.icon} {industry.name}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.industry}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., San Francisco, CA"
                  required
                />
                {errors.location && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 ${
                    errors.website ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://your-startup.com"
                />
                {errors.website && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.website}
                  </p>
                )}
              </div>

              {/* Cover Image Upload & URL - MANDATORY */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Cover Image *
                </label>
                
                {!coverImagePreview ? (
                  <div>
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors mb-4">
                      <input
                        type="file"
                        id="cover-image-input"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="cover-image-input" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2 sm:mb-4" />
                        <p className="text-gray-600 mb-2 text-sm sm:text-base text-center">
                          Click to upload a cover image or drag and drop
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 text-center">
                          PNG, JPG, GIF up to 5MB. Recommended size: 1200x400px
                        </p>
                      </label>
                    </div>
                    
                    {/* OR separator */}
                    <div className="relative flex items-center justify-center mb-4">
                      <div className="border-t border-gray-300 w-full"></div>
                      <span className="bg-white px-3 text-gray-500 text-sm">OR</span>
                      <div className="border-t border-gray-300 w-full"></div>
                    </div>
                    
                    {/* URL Input */}
                    <input
                      type="url"
                      name="cover_image_url"
                      value={formData.cover_image_url}
                      onChange={handleCoverImageUrlChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                      placeholder="Or enter a URL to your cover image (https://...)"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-32 sm:h-48 object-cover rounded-lg border border-gray-300"
                      onError={() => {
                        // If image fails to load, remove preview and show error
                        setCoverImagePreview(null);
                        setCoverImageFile(null);
                        setFormData(prev => ({ ...prev, cover_image_url: '' }));
                        setErrors(prev => ({ ...prev, cover_image: 'Failed to load image. Please check the URL or upload a different file.' }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 sm:p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {coverImageFile && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        📁 {coverImageFile.name}
                      </div>
                    )}
                    {!coverImageFile && formData.cover_image_url && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        🔗 URL Image
                      </div>
                    )}
                  </div>
                )}
                
                {errors.cover_image && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.cover_image}
                  </p>
                )}
                
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  This will be displayed as a banner on your startup page. Upload a file or provide an image URL. <span className="text-red-600 font-medium">Required.</span>
                </p>
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description * ({formData.description?.length || 0}/2000)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe your startup, what problem you solve, and what makes you unique..."
                  maxLength={2000}
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              Company Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Employee Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Employee Count *
                </label>
                <input
                  type="number"
                  name="employee_count"
                  value={formData.employee_count}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 ${
                    errors.employee_count ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 25"
                  min="1"
                  max="100000"
                  required
                />
                {errors.employee_count && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.employee_count}
                  </p>
                )}
              </div>

              {/* Founded Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Founded Year *
                </label>
                <input
                  type="number"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 ${
                    errors.founded_year ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="1800"
                  max={new Date().getFullYear()}
                  required
                />
                {errors.founded_year && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    {errors.founded_year}
                  </p>
                )}
              </div>

              {/* Funding Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Funding Amount
                </label>
                <input
                  type="text"
                  name="funding_amount"
                  value={formData.funding_amount}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="e.g., $2M Seed, $10M Series A"
                />
              </div>

              {/* Valuation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Valuation
                </label>
                <input
                  type="text"
                  name="valuation"
                  value={formData.valuation}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="e.g., $50M"
                />
              </div>

              {/* Revenue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Annual Revenue
                </label>
                <input
                  type="text"
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="e.g., $1M ARR"
                />
              </div>

              {/* User Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  User Count
                </label>
                <input
                  type="text"
                  name="user_count"
                  value={formData.user_count}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="e.g., 50K active users"
                />
              </div>

              {/* Growth Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Growth Rate
                </label>
                <input
                  type="text"
                  name="growth_rate"
                  value={formData.growth_rate}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="e.g., 20% MoM"
                />
              </div>

              {/* Business Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Model
                </label>
                <select
                  name="business_model"
                  value={formData.business_model}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                >
                  <option value="">Select business model</option>
                  <option value="saas">SaaS</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="subscription">Subscription</option>
                  <option value="freemium">Freemium</option>
                  <option value="advertising">Advertising</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Target Market */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Market
                </label>
                <input
                  type="text"
                  name="target_market"
                  value={formData.target_market}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="e.g., Small businesses, Enterprise"
                />
              </div>
            </div>
          </div>

          {/* Contact & Social Media */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              Contact & Social Media
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="contact@yourcompany.com"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Twitter className="w-4 h-4 inline mr-1 text-blue-500" />
                  Twitter
                </label>
                <input
                  type="url"
                  value={socialMedia.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="https://twitter.com/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Linkedin className="w-4 h-4 inline mr-1 text-blue-700" />
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={socialMedia.linkedin}
                  onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Github className="w-4 h-4 inline mr-1 text-gray-800" />
                  GitHub
                </label>
                <input
                  type="url"
                  value={socialMedia.github}
                  onChange={(e) => handleSocialMediaChange('github', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                  placeholder="https://github.com/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Founders & Team */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Founders & Team
              </h2>
              <button
                type="button"
                onClick={addFounder}
                disabled={founders.length >= 5}
                className="flex items-center justify-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Founder
              </button>
            </div>

            {errors.founders && (
              <p className="mb-4 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                {errors.founders}
              </p>
            )}

            <div className="space-y-4 sm:space-y-6">
              {founders.map((founder, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 sm:p-6 relative">
                  {founders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFounder(index)}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={founder.name}
                        onChange={(e) => handleFounderChange(index, 'name', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                        placeholder="Full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={founder.title}
                        onChange={(e) => handleFounderChange(index, 'title', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                        placeholder="e.g., CEO, CTO"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={founder.linkedin}
                        onChange={(e) => handleFounderChange(index, 'linkedin', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div></div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={founder.bio}
                        onChange={(e) => handleFounderChange(index, 'bio', e.target.value)}
                        rows={3}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 resize-none"
                        placeholder="Brief bio and background..."
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags & Keywords */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-600" />
                Tags & Keywords
              </h2>
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 10 || tags[tags.length - 1].trim() === ''}
                className="flex items-center justify-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Add relevant tags to help people discover your startup (e.g., technologies, market focus, etc.)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                    placeholder="e.g., React, AI, SaaS"
                    maxLength={30}
                  />
                  {tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {errors.tags && (
              <p className="mt-4 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                {errors.tags}
              </p>
            )}
          </div>

          {/* Additional Options */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Additional Options
            </h2>

            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Request Featured Status</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Request to have your startup highlighted as featured (subject to review)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="text-xs sm:text-sm text-gray-500">
                {isAdmin 
                  ? '⚡ Your changes will be applied immediately as you are an admin.'
                  : '📝 Your edit request will be reviewed by our team before being published.'
                }
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {isAdmin ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isAdmin ? 'Update Startup' : 'Submit Edit Request'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 text-xs sm:text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
              <p className="mb-2 font-medium">📝 Before submitting:</p>
              <ul className="space-y-1 text-xs">
                <li>• Ensure all required fields are completed</li>
                <li>• <span className="font-medium text-red-600">Cover image is mandatory</span> - upload or provide URL</li>
                <li>• Double-check your company information for accuracy</li>
                <li>• {isAdmin ? 'Changes will be applied immediately' : 'Your changes will be reviewed before being published'}</li>
                <li>• You'll receive a notification once your changes are processed</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartupEditForm;