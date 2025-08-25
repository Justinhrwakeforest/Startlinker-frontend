import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';

const ProfilePictureUpload = ({ currentAvatar, onUpload, onCancel, isUploading = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select an image smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPreview(true);
    
    // Load image to calculate optimal initial scale
    const img = new Image();
    img.onload = () => {
      const imageAspect = img.naturalWidth / img.naturalHeight;
      // Calculate scale to ensure image covers the preview area
      const initialScale = imageAspect > 1 ? 1.2 : 1.2; // Slightly larger to ensure coverage
      setCrop({ x: 0, y: 0, scale: initialScale, rotation: 0 });
    };
    img.src = url;
  };

  const handleCropChange = (property, value) => {
    setCrop(prev => ({ ...prev, [property]: value }));
  };

  const getCroppedCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !image.complete || !image.naturalWidth) {
      console.log('Canvas or image not ready:', { canvas: !!canvas, image: !!image, complete: image?.complete, naturalWidth: image?.naturalWidth });
      return null;
    }

    const ctx = canvas.getContext('2d');
    const size = 512; // Output size
    
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Save context state
    ctx.save();

    // Center the canvas
    ctx.translate(size / 2, size / 2);
    
    // Apply rotation
    ctx.rotate((crop.rotation * Math.PI) / 180);

    // Calculate dimensions to cover the entire canvas (like CSS object-fit: cover)
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = 1; // Square canvas
    
    let drawWidth, drawHeight;
    
    if (imageAspect > canvasAspect) {
      // Image is wider than canvas - fit to height
      drawHeight = size;
      drawWidth = drawHeight * imageAspect;
    } else {
      // Image is taller than canvas - fit to width
      drawWidth = size;
      drawHeight = drawWidth / imageAspect;
    }
    
    // Apply user's zoom scale
    drawWidth *= crop.scale;
    drawHeight *= crop.scale;

    // Draw image centered with crop offset
    ctx.drawImage(
      image,
      -(drawWidth / 2) + crop.x,
      -(drawHeight / 2) + crop.y,
      drawWidth,
      drawHeight
    );

    // Restore context state
    ctx.restore();

    console.log('Canvas created successfully with size:', size);
    return canvas;
  }, [crop]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const canvas = getCroppedCanvas();
    if (!canvas) {
      console.error('Failed to create cropped canvas');
      alert('Failed to process image. Please try again.');
      return;
    }

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        alert('Failed to process image. Please try again.');
        return;
      }

      console.log('Created cropped image blob:', blob.size, 'bytes');

      // Create a new file from the blob
      const croppedFile = new File([blob], `profile_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      try {
        await onUpload(croppedFile);
        handleCancel();
      } catch (error) {
        console.error('Upload failed:', error);
        // Don't handle the error here, let the parent component handle it
      }
    }, 'image/jpeg', 0.9);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowPreview(false);
    setCrop({ x: 0, y: 0, scale: 1, rotation: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Upload Profile Picture</h3>
            
            {currentAvatar && (
              <div className="mb-4">
                <img 
                  src={currentAvatar} 
                  alt="Current profile" 
                  className="w-24 h-24 rounded-full mx-auto object-cover"
                />
                <p className="text-sm text-gray-500 mt-2">Current profile picture</p>
              </div>
            )}

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={triggerFileSelect}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span>Choose Photo</span>
              </button>
              
              <button
                onClick={handleCancel}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-screen overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Crop Your Photo</h3>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="relative mb-6">
          <div className="w-full max-w-md mx-auto bg-gray-100 rounded-xl overflow-hidden relative" style={{ aspectRatio: '1' }}>
            {previewUrl && (
              <>
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.scale}) rotate(${crop.rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                  onLoad={() => {
                    console.log('Image loaded for cropping');
                  }}
                  onError={(e) => {
                    console.error('Error loading image for cropping:', e);
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Position Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X Position</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={crop.x}
                  onChange={(e) => handleCropChange('x', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y Position</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={crop.y}
                  onChange={(e) => handleCropChange('y', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Scale Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scale</label>
            <div className="flex items-center space-x-2">
              <ZoomOut className="w-4 h-4 text-gray-500" />
              <input
                type="range"
                min="1.0"
                max="3"
                step="0.1"
                value={crop.scale}
                onChange={(e) => handleCropChange('scale', parseFloat(e.target.value))}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Rotation Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rotation</label>
            <div className="flex items-center space-x-2">
              <RotateCw className="w-4 h-4 text-gray-500" />
              <input
                type="range"
                min="0"
                max="360"
                value={crop.rotation}
                onChange={(e) => handleCropChange('rotation', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 min-w-[3rem]">{crop.rotation}°</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setPreviewUrl(null);
              setShowPreview(false);
              setSelectedFile(null);
              triggerFileSelect();
            }}
            className="flex-1 bg-blue-100 text-blue-700 py-3 px-4 rounded-xl hover:bg-blue-200 transition-colors"
          >
            Choose Different Photo
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;