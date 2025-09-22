import React, { useState, useEffect } from 'react';

// Extend window interface for event handlers
declare global {
  interface Window {
    handleStatusChange?: (event: CustomEvent) => void;
    handleError?: (event: CustomEvent) => void;
    handleCallStart?: (event: CustomEvent) => void;
    handleCallEnd?: (event: CustomEvent) => void;
  }
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  public_visible: boolean;
  outbound_only: boolean;
  colors: {
    primary: string;
    secondary: string;
    background?: string;
    text?: string;
  };
}

// Default color schemes for campaigns
const defaultColorSchemes = [
  {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    background: '#f8fafc',
    text: '#1e293b'
  },
  {
    primary: '#059669',
    secondary: '#047857',
    background: '#f0fdf4',
    text: '#064e3b'
  },
  {
    primary: '#dc2626',
    secondary: '#b91c1c',
    background: '#fef2f2',
    text: '#991b1b'
  },
  {
    primary: '#16a34a',
    secondary: '#15803d',
    background: '#f0fdf4',
    text: '#14532d'
  },
  {
    primary: '#7c3aed',
    secondary: '#6d28d9',
    background: '#faf5ff',
    text: '#581c87'
  }
];

// Helper function to assign colors to campaigns
const assignColorsToCampaign = (campaign: any, index: number): Campaign => {
  const colorScheme = defaultColorSchemes[index % defaultColorSchemes.length];
  return {
    ...campaign,
    colors: colorScheme
  };
};

export const Homepage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [customColors, setCustomColors] = useState<{
    primary: string;
    secondary: string;
    background: string;
    text: string;
  }>({
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    background: '#f8fafc',
    text: '#1e293b'
  });
  const [formConfig, setFormConfig] = useState<{
    showFullForm: boolean;
    title: string;
    description: string;
    showPhone: boolean;
    showName: boolean;
    showEmail: boolean;
    connectButtonText: string;
    cancelButtonText: string;
  }>({
    showFullForm: false,
    title: 'Caller Information',
    description: '',
    showPhone: true,
    showName: true,
    showEmail: true,
    connectButtonText: 'Connect',
    cancelButtonText: 'Cancel'
  });
  const [embedCode, setEmbedCode] = useState<string>('');
  const [showEmbedCode, setShowEmbedCode] = useState<boolean>(false);
  const [showEventHandlers, setShowEventHandlers] = useState<boolean>(false);
  const [showCustomization, setShowCustomization] = useState<boolean>(false);
  const [showInteractivePreview, setShowInteractivePreview] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      generateEmbedCode();
    }
  }, [selectedCampaign, customColors, formConfig]);

  // Add event listeners for interactive preview
  useEffect(() => {
    if (showInteractivePreview) {
      window.handleStatusChange = handleStatusChange;
      window.handleError = handleError;
      window.handleCallStart = handleCallStart;
      window.handleCallEnd = handleCallEnd;
    }

    return () => {
      // Cleanup event listeners
      delete window.handleStatusChange;
      delete window.handleError;
      delete window.handleCallStart;
      delete window.handleCallEnd;
    };
  }, [showInteractivePreview]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendUrl = import.meta.env.VITE_AUTODIALER_API_URL || 'http://localhost:5001';
      
      const response = await fetch(`${backendUrl}/api/campaigns_public`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from API');
      }
      
      // Assign colors to campaigns and set them
      const campaignsWithColors = data.data.map((campaign: any, index: number) => 
        assignColorsToCampaign(campaign, index)
      );
      
      setCampaigns(campaignsWithColors);
      
      // Set the first campaign as selected if available
      if (campaignsWithColors.length > 0) {
        setSelectedCampaign(campaignsWithColors[0]);
      }
      
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      
      // Fallback to mock data if API fails
      const mockCampaigns: Campaign[] = [
        {
          id: 'mock-1',
          name: 'Demo Campaign',
          status: 'active',
          public_visible: true,
          outbound_only: false,
          colors: defaultColorSchemes[0]
        }
      ];
      setCampaigns(mockCampaigns);
      setSelectedCampaign(mockCampaigns[0]);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedCode = () => {
    if (!selectedCampaign) return;
    
    const formFields = [];
    if (formConfig.showPhone) formFields.push('  phone=""');
    if (formConfig.showName) formFields.push('  name=""');
    if (formConfig.showEmail) formFields.push('  email=""');
    
    const code = `
    <autodialer-widget
      tenant="your-tenant-id"
      token="your-access-token"
      campaign-id="${selectedCampaign.id}"
      primary-color="${customColors.primary}"
      secondary-color="${customColors.secondary}"
      ${customColors.background ? `background-color="${customColors.background}"` : ''}
      ${customColors.text ? `text-color="${customColors.text}"` : ''}
    ${formFields.join('\n')}
      on-status-change="handleStatusChange"
      on-error="handleError"
      on-call-start="handleCallStart"
      on-call-end="handleCallEnd">
    </autodialer-widget>

    <script src="${import.meta.env.VITE_BASE_URL || 'https://autodialer-emebd.vercel.app'}/autodialer-widget.js"></script>`;
    
    setEmbedCode(code);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Event handlers for interactive preview
  const handleStatusChange = (event: CustomEvent) => {
    console.log('Status changed:', event.detail.status);
  };

  const handleError = (event: CustomEvent) => {
    console.error('Error:', event.detail.error);
  };

  const handleCallStart = (event: CustomEvent) => {
    console.log('Call started:', event.detail);
  };

  const handleCallEnd = (event: CustomEvent) => {
    console.log('Call ended:', event.detail);
  };

  // Debug: Log environment variables
  console.log('VITE_EMBED_TOKEN:', import.meta.env.VITE_EMBED_TOKEN);
  console.log('All env vars:', import.meta.env);
  console.log('Token in template:', `${import.meta.env.VITE_EMBED_TOKEN}`);
  console.log('Is token undefined?', import.meta.env.VITE_EMBED_TOKEN === undefined);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Embed code copied to clipboard!</span>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Common Threads Calling Widget</h1>
              <p className="text-gray-600 mt-1">Embeddable campaign dialer with customizable styling</p>
            </div>
            <div className="text-sm text-gray-500">
              Version 1.0.0
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Campaign
                  </label>
                  <select
                    value={selectedCampaign?.id || ''}
                    onChange={(e) => {
                      const campaign = campaigns.find(c => c.id === e.target.value);
                      if (campaign) setSelectedCampaign(campaign);
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <option>Loading campaigns...</option>
                    ) : campaigns.length === 0 ? (
                      <option>No campaigns available</option>
                    ) : (
                      campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedCampaign && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedCampaign.name}</h3>
                    <p className="text-gray-600 mb-4">Campaign ID: {selectedCampaign.id}</p>
                  
                  {/* Customize Widget Accordion */}
                  <div className="pt-4">
                    <button
                      onClick={() => setShowCustomization(!showCustomization)}
                      className="font-medium text-gray-900 mb-2 hover:text-blue-600 transition-colors flex items-center"
                    >
                      Customize Widget {showCustomization ? '▼' : '▶'}
                    </button>
                    
                    {showCustomization && (
                      <div className="space-y-6">
                        {/* Color Customization */}
                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Customize Colors</h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-20">Primary:</span>
                              <input
                                type="color"
                                value={customColors.primary}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customColors.primary}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                                className="text-sm text-gray-600 font-mono px-2 py-1 border border-gray-300 rounded w-24"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-20">Secondary:</span>
                              <input
                                type="color"
                                value={customColors.secondary}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, secondary: e.target.value }))}
                                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customColors.secondary}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, secondary: e.target.value }))}
                                className="text-sm text-gray-600 font-mono px-2 py-1 border border-gray-300 rounded w-24"
                              />
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-20">Background:</span>
                              <input
                                type="color"
                                value={customColors.background}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customColors.background}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                                className="text-sm text-gray-600 font-mono px-2 py-1 border border-gray-300 rounded w-24"
                              />
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-20">Text:</span>
                              <input
                                type="color"
                                value={customColors.text}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, text: e.target.value }))}
                                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customColors.text}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, text: e.target.value }))}
                                className="text-sm text-gray-600 font-mono px-2 py-1 border border-gray-300 rounded w-24"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Form Configuration */}
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Form Configuration</h4>
                          
                          <div className="space-y-4">
                            {/* Show Full Form Toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Show Full Form</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formConfig.showFullForm}
                                  onChange={(e) => setFormConfig(prev => ({ ...prev, showFullForm: e.target.checked }))}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            {formConfig.showFullForm && (
                              <>
                                {/* Title */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Form Title
                                  </label>
                                  <input
                                    type="text"
                                    value={formConfig.title}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Caller Information"
                                  />
                                </div>

                                {/* Description */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optional)
                                  </label>
                                  <textarea
                                    value={formConfig.description}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Enter a description for your form..."
                                  />
                                </div>

                                {/* Field Toggles */}
                                <div className="space-y-3">
                                  <h5 className="text-sm font-medium text-gray-700">Show Fields:</h5>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Phone Number</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={formConfig.showPhone}
                                        onChange={(e) => setFormConfig(prev => ({ ...prev, showPhone: e.target.checked }))}
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Name</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={formConfig.showName}
                                        onChange={(e) => setFormConfig(prev => ({ ...prev, showName: e.target.checked }))}
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Email</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={formConfig.showEmail}
                                        onChange={(e) => setFormConfig(prev => ({ ...prev, showEmail: e.target.checked }))}
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                  </div>
                                </div>

                                {/* Button Text Configuration */}
                                <div className="space-y-3 pt-4 border-t">
                                  <h5 className="text-sm font-medium text-gray-700">Button Text:</h5>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Connect Button Text
                                    </label>
                                    <input
                                      type="text"
                                      value={formConfig.connectButtonText}
                                      onChange={(e) => setFormConfig(prev => ({ ...prev, connectButtonText: e.target.value }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Connect"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Cancel Button Text
                                    </label>
                                    <input
                                      type="text"
                                      value={formConfig.cancelButtonText}
                                      onChange={(e) => setFormConfig(prev => ({ ...prev, cancelButtonText: e.target.value }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Cancel"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error loading campaigns
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => setShowEmbedCode(!showEmbedCode)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {showEmbedCode ? 'Hide' : 'Show'} Embed Code
                  </button>
                </div>
              </div>
            </div>

            {showEmbedCode && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Embed Code</h3>
                  <button
                    onClick={copyToClipboard}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Interactive Mode</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInteractivePreview}
                      onChange={(e) => setShowInteractivePreview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
                    <p className="text-gray-600 mb-6">
                    {showInteractivePreview 
                        ? "Test the widget functionality with the selected campaign styling. Note: This uses demo credentials and may not connect to actual services."
                        : "See how your widget will look with the selected campaign styling (disabled for preview):"
                    }
              </p>
              
              {selectedCampaign ? (
                <div className="flex justify-center">
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: `<autodialer-widget
                        tenant="demo"
                        token="${import.meta.env.VITE_EMBED_TOKEN}"
                        campaign-id="${selectedCampaign.id}"
                        primary-color="${customColors.primary}"
                        secondary-color="${customColors.secondary}"
                        ${customColors.background ? `background-color="${customColors.background}"` : ''}
                        ${customColors.text ? `text-color="${customColors.text}"` : ''}
                        ${formConfig.showPhone ? 'phone=""' : ''}
                        ${formConfig.showName ? 'name=""' : ''}
                        ${formConfig.showEmail ? 'email=""' : ''}
                        ${formConfig.title ? `form-title="${formConfig.title}"` : ''}
                        ${formConfig.description ? `form-description="${formConfig.description}"` : ''}
                        ${formConfig.showPhone ? 'show-phone' : ''}
                        ${formConfig.showName ? 'show-name' : ''}
                        ${formConfig.showEmail ? 'show-email' : ''}
                        ${formConfig.connectButtonText ? `connect-button-text="${formConfig.connectButtonText}"` : ''}
                        ${formConfig.cancelButtonText ? `cancel-button-text="${formConfig.cancelButtonText}"` : ''}
                        ${formConfig.showFullForm ? 'show-full-form' : ''}
                        ${!showInteractivePreview ? 'disabled' : ''}
                        ${showInteractivePreview ? 'on-status-change="handleStatusChange" on-error="handleError" on-call-start="handleCallStart" on-call-end="handleCallEnd"' : ''}>
                      </autodialer-widget>`
                    }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Select a campaign to see the preview</p>
                </div>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use</h2>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">1. Include the Script</h3>
                  <p>Add the autodialer widget script to your HTML page:</p>
                  <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
                    <code>{'<script src="${import.meta.env.VITE_BASE_URL || \'https://autodialer-emebd.vercel.app\'}/autodialer-widget.js"></script>'}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">2. Add the Widget</h3>
                  <p>Place the autodialer-widget element where you want it to appear:</p>
                  <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
                    <code>{'<autodialer-widget\n  tenant="your-tenant"\n  token="your-token"\n  campaign-id="your-campaign"\n  primary-color="#your-color">\n</autodialer-widget>'}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">3. Configure Attributes</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>tenant:</strong> Your tenant identifier</li>
                    <li><strong>token:</strong> Your access token</li>
                    <li><strong>campaign-id:</strong> Target campaign ID</li>
                    <li><strong>primary-color:</strong> Main button color (hex)</li>
                    <li><strong>secondary-color:</strong> Hover/secondary color (hex)</li>
                    <li><strong>background-color:</strong> Background color (optional)</li>
                    <li><strong>text-color:</strong> Text color (optional)</li>
                  </ul>
                </div>

                <div>
                  <button
                    onClick={() => setShowEventHandlers(!showEventHandlers)}
                    className="font-medium text-gray-900 mb-2 hover:text-blue-600 transition-colors"
                  >
                    4. Event Handlers (Optional) {showEventHandlers ? '▼' : '▶'}
                  </button>
                  {showEventHandlers && (
                    <div className="mt-2">
                      <p className="text-gray-600 mb-2">Add JavaScript functions to handle widget events:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
                        <code>
                          {`function handleStatusChange(event) {
                            console.log('Status changed:', event.detail.status);
                          }

                          function handleError(event) {
                            console.error('Error:', event.detail.error);
                          }`}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
