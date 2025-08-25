import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Save, Type, Palette, Scissors, RotateCcw, Download,
  Sun, Moon, Contrast, Droplets, Wind, Sparkles, Zap,
  Move, Square, Circle, ZoomIn, ZoomOut, FlipHorizontal,
  FlipVertical, RotateCw, Crop, Maximize2, Minimize2
} from 'lucide-react';

const ImageEditor = ({ imageFile, onSave, onCancel }) => {
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  
  // Text overlay states
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState('center');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(24);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  
  // Transform states
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Crop states
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Create image URL from file
    if (imageFile) {
      setImageLoading(true);
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    console.error('Failed to load image');
  };

  // Generate CSS filter string
  const getFilterStyle = () => {
    let filters = [];
    
    // Manual adjustments
    if (brightness !== 100) {
      filters.push(`brightness(${brightness}%)`);
    }
    
    if (contrast !== 100) {
      filters.push(`contrast(${contrast}%)`);
    }
    
    if (saturation !== 100) {
      filters.push(`saturate(${saturation}%)`);
    }
    
    if (blur > 0) {
      filters.push(`blur(${blur}px)`);
    }
    
    if (hue !== 0) {
      filters.push(`hue-rotate(${hue}deg)`);
    }
    
    if (sepia > 0) {
      filters.push(`sepia(${sepia}%)`);
    }
    
    if (grayscale > 0) {
      filters.push(`grayscale(${grayscale}%)`);
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
      case 'soft':
        filters.push('blur(0.5px) brightness(1.1) saturate(0.8)');
        break;
      default:
        break;
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  // Generate transform string
  const getTransformStyle = () => {
    let transforms = [];
    
    if (rotation !== 0) {
      transforms.push(`rotate(${rotation}deg)`);
    }
    
    if (zoom !== 1) {
      transforms.push(`scale(${zoom})`);
    }
    
    if (flipHorizontal) {
      transforms.push('scaleX(-1)');
    }
    
    if (flipVertical) {
      transforms.push('scaleY(-1)');
    }
    
    return transforms.length > 0 ? transforms.join(' ') : 'none';
  };

  const applyFilter = (filter) => {
    setSelectedFilter(filter);
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setHue(0);
    setSepia(0);
    setGrayscale(0);
    setSelectedFilter('none');
  };

  const resetTransforms = () => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setZoom(1);
  };

  const handleRotate = (degrees) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipHorizontal(!flipHorizontal);
  };

  const handleFlipVertical = () => {
    setFlipVertical(!flipVertical);
  };

  const handleZoom = (delta) => {
    setZoom((prev) => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      // Create processed image object with metadata
      const processedImage = {
        file: imageFile,
        filters: {
          preset: selectedFilter,
          brightness,
          contrast,
          saturation,
          blur,
          hue,
          sepia,
          grayscale
        },
        transforms: {
          rotation,
          flipHorizontal,
          flipVertical,
          zoom
        },
        textOverlay: showTextOverlay ? {
          text: textOverlay,
          position: textPosition,
          color: textColor,
          size: textSize
        } : null,
        cropArea: cropMode ? cropArea : null
      };
      
      // Call the onSave callback with processed image data
      onSave(processedImage);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Edit Your Story Image
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
          {/* Image Preview */}
          <div className="lg:w-2/3 p-4 bg-gray-100">
            <div className="relative w-full h-full bg-white rounded-lg overflow-hidden border-2 border-gray-200">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading image...</p>
                  </div>
                </div>
              )}
              
              {imageUrl && (
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Preview"
                  className={`w-full h-full object-contain transition-all duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  style={{ 
                    filter: getFilterStyle(),
                    transform: getTransformStyle()
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              
              {!imageUrl && !imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Palette className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No image loaded</p>
                  </div>
                </div>
              )}
              
              {/* Text Overlay */}
              {showTextOverlay && textOverlay && (
                <div 
                  className={`absolute inset-0 flex items-${
                    textPosition === 'top' ? 'start' : 
                    textPosition === 'bottom' ? 'end' : 'center'
                  } justify-center p-4 pointer-events-none`}
                >
                  <p 
                    className="font-bold drop-shadow-lg text-center"
                    style={{ 
                      color: textColor,
                      fontSize: `${textSize}px`
                    }}
                  >
                    {textOverlay}
                  </p>
                </div>
              )}

              {/* Crop overlay */}
              {cropMode && (
                <div className="absolute inset-0 bg-black bg-opacity-50">
                  <div 
                    className="absolute border-2 border-white border-dashed"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Editing Tools */}
          <div className="lg:w-1/3 p-4 bg-gray-50 overflow-y-auto">
            <div className="space-y-6">
              {/* Filters */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Filters
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'None', value: 'none', icon: X },
                    { name: 'Vintage', value: 'vintage', icon: Moon },
                    { name: 'B&W', value: 'blackwhite', icon: Contrast },
                    { name: 'Cold', value: 'cold', icon: Wind },
                    { name: 'Warm', value: 'warm', icon: Sun },
                    { name: 'Dramatic', value: 'dramatic', icon: Zap },
                    { name: 'Soft', value: 'soft', icon: Droplets }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => applyFilter(filter.value)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        selectedFilter === filter.value
                          ? 'bg-blue-600 text-white'
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
                  <Contrast className="w-4 h-4 mr-2" />
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
                    <span className="text-xs text-gray-500">{brightness}%</span>
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
                    <span className="text-xs text-gray-500">{contrast}%</span>
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
                    <span className="text-xs text-gray-500">{saturation}%</span>
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
                    <span className="text-xs text-gray-500">{blur}px</span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Hue</label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={hue}
                      onChange={(e) => setHue(e.target.value)}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{hue}°</span>
                  </div>
                </div>
                <button
                  onClick={resetAdjustments}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset Adjustments
                </button>
              </div>

              {/* Transform Tools */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <RotateCw className="w-4 h-4 mr-2" />
                  Transform
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handleRotate(90)}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-center"
                  >
                    <RotateCw className="w-5 h-5 text-gray-700 mb-1" />
                    <span className="text-xs text-gray-600">Rotate Right</span>
                  </button>
                  <button
                    onClick={() => handleRotate(-90)}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-center"
                  >
                    <RotateCcw className="w-5 h-5 text-gray-700 mb-1" />
                    <span className="text-xs text-gray-600">Rotate Left</span>
                  </button>
                  <button
                    onClick={handleFlipHorizontal}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-center"
                  >
                    <FlipHorizontal className="w-5 h-5 text-gray-700 mb-1" />
                    <span className="text-xs text-gray-600">Flip H</span>
                  </button>
                  <button
                    onClick={handleFlipVertical}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-center"
                  >
                    <FlipVertical className="w-5 h-5 text-gray-700 mb-1" />
                    <span className="text-xs text-gray-600">Flip V</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-700">Zoom</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleZoom(-0.1)}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <button
                        onClick={() => handleZoom(0.1)}
                        className="p-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
                  </div>
                </div>
                
                <button
                  onClick={resetTransforms}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Reset Transform
                </button>
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
                        showTextOverlay ? 'bg-blue-600' : 'bg-gray-300'
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
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="top" className="text-gray-900 bg-white">Top</option>
                          <option value="center" className="text-gray-900 bg-white">Center</option>
                          <option value="bottom" className="text-gray-900 bg-white">Bottom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-700">Size</label>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={textSize}
                          onChange={(e) => setTextSize(e.target.value)}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{textSize}px</span>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-700">Color</label>
                        <div className="flex space-x-2 mt-1">
                          {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#FFA500'].map(color => (
                            <button
                              key={color}
                              onClick={() => setTextColor(color)}
                              className={`w-8 h-8 rounded-full border-2 ${
                                textColor === color ? 'border-blue-600' : 'border-gray-300'
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
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Image
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

export default ImageEditor;