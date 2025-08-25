// src/components/Settings.js - Responsive Enhanced Version
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from '../config/axios';
import { 
  Settings as SettingsIcon, User, Bell, Shield, 
  Eye, Mail, Key, Download, Trash2, Save,
  Check, X, AlertTriangle, CreditCard,
  ChevronDown, Menu
} from 'lucide-react';

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      weekly_digest: true,
      job_alerts: true,
      startup_updates: true
    },
    privacy: {
      profile_visibility: 'public',
      show_activity: true,
      show_bookmarks: false,
      show_ratings: true,
      allow_messages: true
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      items_per_page: 20
    }
  });
  const [settingsError, setSettingsError] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: ''
  });
  const [saveStatus, setSaveStatus] = useState('');

  // Load user settings from backend on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const response = await axios.get('/api/auth/settings/');
        const backendSettings = response.data;
        
        // Map backend settings to frontend state structure
        setSettings({
          notifications: {
            email_notifications: backendSettings.email_notifications,
            push_notifications: backendSettings.push_notifications,
            marketing_emails: backendSettings.marketing_emails,
            weekly_digest: backendSettings.weekly_digest,
            job_alerts: backendSettings.job_alerts,
            startup_updates: backendSettings.startup_updates
          },
          privacy: {
            profile_visibility: backendSettings.profile_visibility,
            show_activity: backendSettings.show_activity,
            show_bookmarks: backendSettings.show_bookmarks,
            show_ratings: backendSettings.show_ratings,
            allow_messages: backendSettings.allow_messages
          },
          preferences: {
            theme: backendSettings.theme,
            language: backendSettings.language,
            timezone: backendSettings.timezone,
            items_per_page: backendSettings.items_per_page
          }
        });
        setSettingsError('');
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettingsError('Failed to load settings. Using defaults.');
      } finally {
        setSettingsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'account', label: 'Account', icon: CreditCard }
  ];

  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveStatus('');
    try {
      await axios.patch('/api/auth/profile/', profileData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/change-password/', {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirm: passwordData.confirm_password
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setSaveStatus('password_success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setSaveStatus('password_error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (category, setting, value) => {
    // Optimistically update the UI
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    
    // Save to backend
    await saveSettingsToBackend(category, setting, value);
  };
  
  const saveSettingsToBackend = async (category, setting, value) => {
    // Store the previous value for potential revert
    const previousValue = settings[category][setting];
    
    try {
      // Flatten the settings for the API call
      const flattenedSettings = {
        // Notifications
        email_notifications: settings.notifications.email_notifications,
        push_notifications: settings.notifications.push_notifications,
        marketing_emails: settings.notifications.marketing_emails,
        weekly_digest: settings.notifications.weekly_digest,
        job_alerts: settings.notifications.job_alerts,
        startup_updates: settings.notifications.startup_updates,
        // Privacy
        profile_visibility: settings.privacy.profile_visibility,
        show_activity: settings.privacy.show_activity,
        show_bookmarks: settings.privacy.show_bookmarks,
        show_ratings: settings.privacy.show_ratings,
        allow_messages: settings.privacy.allow_messages,
        // Preferences
        theme: settings.preferences.theme,
        language: settings.preferences.language,
        timezone: settings.preferences.timezone,
        items_per_page: settings.preferences.items_per_page
      };
      
      // Update the specific setting that was changed
      if (category === 'notifications') {
        flattenedSettings[setting] = value;
      } else if (category === 'privacy') {
        flattenedSettings[setting] = value;
      } else if (category === 'preferences') {
        flattenedSettings[setting] = value;
      }
      
      await axios.put('/api/auth/settings/', flattenedSettings);
      
      // Show success message briefly
      setSaveStatus('settings_success');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('settings_error');
      setTimeout(() => setSaveStatus(''), 3000);
      
      // Revert the optimistic update on error using the previous value
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: previousValue
        }
      }));
    }
  };

  const handleExportData = async () => {
    try {
      const response = await axios.get('/api/auth/export-data/');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `startlinker-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const confirmation = prompt('Type "DELETE" to confirm account deletion:');
      if (confirmation === 'DELETE') {
        try {
          await axios.delete('/api/auth/profile/');
          logout();
        } catch (error) {
          console.error('Error deleting account:', error);
          alert('Failed to delete account. Please contact support.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile Navigation Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {tabs.find(tab => tab.id === activeTab)?.icon && (
                  React.createElement(tabs.find(tab => tab.id === activeTab).icon, { className: "w-5 h-5 text-gray-600" })
                )}
                <span className="font-medium text-gray-900">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="mt-2 bg-white rounded-xl shadow-sm border border-gray-200 py-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              {/* Settings Error */}
              {settingsError && (
                <div className="mb-6 p-4 rounded-lg flex items-center space-x-2 bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm sm:text-base">{settingsError}</span>
                </div>
              )}
              
              {/* Save Status */}
              {saveStatus && (
                <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
                  saveStatus.includes('success') 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {saveStatus.includes('success') ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  <span className="text-sm sm:text-base">
                    {saveStatus === 'success' && 'Profile updated successfully!'}
                    {saveStatus === 'error' && 'Failed to update profile. Please try again.'}
                    {saveStatus === 'password_success' && 'Password changed successfully!'}
                    {saveStatus === 'password_error' && 'Failed to change password. Please check your current password.'}
                    {saveStatus === 'settings_success' && 'Settings saved successfully!'}
                    {saveStatus === 'settings_error' && 'Failed to save settings. Please try again.'}
                  </span>
                </div>
              )}
              
              {/* Loading state for settings */}
              {settingsLoading && (
                <div className="mb-6 p-4 rounded-lg flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                  <span className="text-sm sm:text-base">Loading settings...</span>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        {
                          key: 'email_notifications',
                          title: 'Email Notifications',
                          description: 'Receive notifications via email'
                        },
                        {
                          key: 'job_alerts',
                          title: 'Job Alerts',
                          description: 'Get notified about new job opportunities'
                        },
                        {
                          key: 'startup_updates',
                          title: 'Startup Updates',
                          description: 'Updates from startups you follow'
                        },
                        {
                          key: 'weekly_digest',
                          title: 'Weekly Digest',
                          description: 'Weekly summary of platform activity'
                        },
                        {
                          key: 'marketing_emails',
                          title: 'Marketing Emails',
                          description: 'Product updates and promotional content'
                        }
                      ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex-1 min-w-0 mr-4">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{notification.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">{notification.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={settings.notifications[notification.key]}
                              onChange={(e) => handleSettingChange('notifications', notification.key, e.target.checked)}
                              className="sr-only peer"
                              disabled={loading}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Privacy Settings</h2>
                  
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base">Profile Visibility</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3">Control who can see your profile information</p>
                        <select
                          value={settings.privacy.profile_visibility}
                          onChange={(e) => handleSettingChange('privacy', 'profile_visibility', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value="public">Public - Anyone can see</option>
                          <option value="private">Private - Only you</option>
                          <option value="friends">Friends Only</option>
                        </select>
                      </div>

                      {[
                        {
                          key: 'show_activity',
                          title: 'Show Activity',
                          description: 'Display your ratings and comments publicly'
                        },
                        {
                          key: 'show_bookmarks',
                          title: 'Show Bookmarks',
                          description: 'Allow others to see your bookmarked startups'
                        },
                        {
                          key: 'show_ratings',
                          title: 'Show Ratings',
                          description: 'Display your startup ratings publicly'
                        },
                        {
                          key: 'allow_messages',
                          title: 'Allow Messages',
                          description: 'Let other users send you direct messages'
                        }
                      ].map((privacy) => (
                        <div key={privacy.key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex-1 min-w-0 mr-4">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{privacy.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">{privacy.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={settings.privacy[privacy.key]}
                              onChange={(e) => handleSettingChange('privacy', privacy.key, e.target.checked)}
                              className="sr-only peer"
                              disabled={loading}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Security Settings</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Account Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                      <div>Email: {user?.email}</div>
                      <div>Username: {user?.username}</div>
                      <div>Account created: {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">Change Password</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                        minLength="8"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900"
                        minLength="8"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {loading ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">App Preferences</h2>
                  
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Theme
                        </label>
                        <select
                          value={settings.preferences.theme}
                          onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Items per page
                        </label>
                        <select
                          value={settings.preferences.items_per_page}
                          onChange={(e) => handleSettingChange('preferences', 'items_per_page', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Account Management</h2>
                  
                  {/* Data Export */}
                  <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">Export Your Data</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Download a copy of all your data</p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base flex-shrink-0"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-red-900 mb-2 text-sm sm:text-base">Danger Zone</h3>
                        <p className="text-xs sm:text-sm text-red-700 mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;