import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Play, Pause, RotateCcw, Download, Type, 
  Palette, Scissors, Volume2, VolumeX, Save,
  ChevronLeft, ChevronRight, Zap, Sun, Moon,
  Contrast, Droplets, Wind, Sparkles
} from 'lucide-react';

const VideoEditor = ({ videoFile, onSave, onCancel }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState('center');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timelineRef = useRef(null);
  const videoUrl = useRef(null);

  useEffect(() => {
    // Create video URL from file
    if (videoFile) {
      videoUrl.current = URL.createObjectURL(videoFile);
    }
    
    return () => {
      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
    };
  }, [videoFile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      
      // Auto-pause at trim end
      if (video.currentTime >= trimEnd) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = trimStart;
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Set initial trim end to min of video duration or 60 seconds
      setTrimEnd(Math.min(video.duration, 60));
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [trimEnd, trimStart]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e) => {
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = (x / rect.width) * duration;
    
    // Ensure clicked time is within trim bounds
    const newTime = Math.max(trimStart, Math.min(clickedTime, trimEnd));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTrimStartChange = (value) => {
    const newStart = parseFloat(value);
    setTrimStart(newStart);
    
    // Ensure trim end is at least 1 second after start and max 60 seconds
    if (trimEnd - newStart > 60) {
      setTrimEnd(newStart + 60);
    } else if (trimEnd <= newStart) {
      setTrimEnd(Math.min(newStart + 1, duration));
    }
    
    if (videoRef.current.currentTime < newStart) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleTrimEndChange = (value) => {
    const newEnd = parseFloat(value);
    
    // Ensure video is max 60 seconds
    const maxEnd = Math.min(trimStart + 60, duration);
    const finalEnd = Math.min(newEnd, maxEnd);
    
    setTrimEnd(finalEnd);
    
    if (videoRef.current.currentTime > finalEnd) {
      videoRef.current.currentTime = trimStart;
    }
  };

  const resetVideo = () => {
    videoRef.current.currentTime = trimStart;
    setCurrentTime(trimStart);
    setIsPlaying(false);
    videoRef.current.pause();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  const applyFilter = (filter) => {
    setSelectedFilter(filter);
  };

  const getFilterStyle = () => {
    let filters = [];
    
    // Brightness
    if (brightness !== 100) {
      filters.push(`brightness(${brightness}%)`);
    }
    
    // Contrast
    if (contrast !== 100) {
      filters.push(`contrast(${contrast}%)`);
    }
    
    // Saturation
    if (saturation !== 100) {
      filters.push(`saturate(${saturation}%)`);
    }
    
    // Blur
    if (blur > 0) {
      filters.push(`blur(${blur}px)`);
    }
    
    // Preset filters
    switch (selectedFilter) {
      case 'vintage':
        filters.push('sepia(0.5) contrast(1.2) brightness(0.9)');
        break;
      case 'blackwhite':
        filters.push('grayscale(1)');
        break;
      case 'cold':
        filters.push('hue-rotate(180deg) saturate(0.8)');
        break;
      case 'warm':
        filters.push('hue-rotate(-30deg) saturate(1.2) brightness(1.1)');
        break;
      case 'dramatic':
        filters.push('contrast(1.4) brightness(0.9) saturate(1.2)');
        break;
      default:
        break;
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      // Create a processed video object with metadata
      const processedVideo = {
        file: videoFile,
        trimStart,
        trimEnd,
        duration: trimEnd - trimStart,
        filters: {
          preset: selectedFilter,
          brightness,
          contrast,
          saturation,
          blur
        },
        textOverlay: showTextOverlay ? {
          text: textOverlay,
          position: textPosition,
          color: textColor
        } : null,
        volume,
        isMuted
      };
      
      // Call the onSave callback with processed video data
      onSave(processedVideo);
    } catch (error) {
      console.error('Error processing video:', error);
      alert('Failed to process video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <Scissors className="w-5 h-5 mr-2" />
              Edit Your Story Video
            </h2>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Video Preview */}
          <div className="lg:w-2/3 p-4 bg-gray-900">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl.current}
                className="w-full h-full object-contain"
                style={{ filter: getFilterStyle() }}
                muted={isMuted}
              />
              
              {/* Text Overlay */}
              {showTextOverlay && textOverlay && (
                <div 
                  className={`absolute inset-0 flex items-${textPosition === 'top' ? 'start' : textPosition === 'bottom' ? 'end' : 'center'} justify-center p-4 pointer-events-none`}
                >
                  <p 
                    className="text-2xl font-bold drop-shadow-lg text-center"
                    style={{ color: textColor }}
                  >
                    {textOverlay}
                  </p>
                </div>
              )}

              {/* Trim Duration Indicator */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                {formatTime(trimEnd - trimStart)} / 60s max
              </div>
            </div>

            {/* Video Controls */}
            <div className="mt-4 space-y-3">
              {/* Timeline */}
              <div 
                ref={timelineRef}
                className="relative h-12 bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
                onClick={handleTimelineClick}
              >
                {/* Trim area */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-30"
                  style={{
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${((trimEnd - trimStart) / duration) * 100}%`
                  }}
                />
                
                {/* Current time indicator */}
                <div 
                  className="absolute top-0 w-0.5 h-full bg-white"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
                
                {/* Trim handles */}
                <div 
                  className="absolute top-0 w-2 h-full bg-purple-500 cursor-ew-resize"
                  style={{ left: `${(trimStart / duration) * 100}%` }}
                />
                <div 
                  className="absolute top-0 w-2 h-full bg-pink-500 cursor-ew-resize"
                  style={{ left: `${(trimEnd / duration) * 100}%` }}
                />
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={resetVideo}
                    className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Volume control */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Trim controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm">Start Time</label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => handleTrimStartChange(e.target.value)}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{formatTime(trimStart)}</span>
                </div>
                <div>
                  <label className="text-white text-sm">End Time</label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => handleTrimEndChange(e.target.value)}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-xs">{formatTime(trimEnd)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Editing Tools */}
          <div className="lg:w-1/3 p-4 bg-gray-50 overflow-y-auto">
            <div className="space-y-6">
              {/* Filters */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  Filters
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'None', value: 'none', icon: X },
                    { name: 'Vintage', value: 'vintage', icon: Moon },
                    { name: 'B&W', value: 'blackwhite', icon: Contrast },
                    { name: 'Cold', value: 'cold', icon: Wind },
                    { name: 'Warm', value: 'warm', icon: Sun },
                    { name: 'Dramatic', value: 'dramatic', icon: Zap }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => applyFilter(filter.value)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFilter === filter.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <filter.icon className="w-4 h-4 mx-auto mb-1" />
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjustments */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Adjustments
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-700">Brightness</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Contrast</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Saturation</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Blur</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={blur}
                      onChange={(e) => setBlur(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Text Overlay */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Type className="w-4 h-4 mr-2" />
                  Text Overlay
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Enable Text</span>
                    <button
                      onClick={() => setShowTextOverlay(!showTextOverlay)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        showTextOverlay ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                        showTextOverlay ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  {showTextOverlay && (
                    <>
                      <textarea
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        placeholder="Enter your text..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        rows={2}
                        maxLength={100}
                      />
                      
                      <div>
                        <label className="text-sm text-gray-700">Position</label>
                        <select
                          value={textPosition}
                          onChange={(e) => setTextPosition(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="top" className="text-gray-900 bg-white">Top</option>
                          <option value="center" className="text-gray-900 bg-white">Center</option>
                          <option value="bottom" className="text-gray-900 bg-white">Bottom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-700">Color</label>
                        <div className="flex space-x-2 mt-1">
                          {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                            <button
                              key={color}
                              onClick={() => setTextColor(color)}
                              className={`w-8 h-8 rounded-full border-2 ${
                                textColor === color ? 'border-purple-600' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="sticky bottom-0 bg-gray-50 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Video
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;