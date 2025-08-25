// frontend/src/components/chat/DragDropArea.js
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Archive, Music, Video, Folder } from 'lucide-react';

const DragDropArea = ({ onFilesDropped, children, className = '' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    const dropAreaRef = useRef(null);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev + 1);
        
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev - 1);
        
        if (dragCounter === 1) {
            setIsDragging(false);
        }
    }, [dragCounter]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(false);
        setDragCounter(0);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            onFilesDropped(files);
        }
    }, [onFilesDropped]);

    return (
        <div
            ref={dropAreaRef}
            className={`relative ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}
            
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Upload className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-blue-700 font-semibold text-lg">Drop files here</p>
                        <p className="text-blue-600 text-sm">Release to upload</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const FilePreview = ({ file, onRemove, index }) => {
    const getFileIcon = (file) => {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();
        
        if (type.startsWith('image/')) {
            return <Image className="w-5 h-5 text-blue-500" />;
        } else if (type.startsWith('video/')) {
            return <Video className="w-5 h-5 text-purple-500" />;
        } else if (type.startsWith('audio/')) {
            return <Music className="w-5 h-5 text-green-500" />;
        } else if (type.includes('pdf') || name.endsWith('.pdf')) {
            return <FileText className="w-5 h-5 text-red-500" />;
        } else if (type.includes('zip') || type.includes('rar') || type.includes('7z')) {
            return <Archive className="w-5 h-5 text-yellow-500" />;
        } else if (type.includes('folder') || type.includes('directory')) {
            return <Folder className="w-5 h-5 text-blue-500" />;
        } else {
            return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFilePreview = () => {
        if (file.type.startsWith('image/')) {
            return (
                <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded-lg"
                />
            );
        }
        return (
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                {getFileIcon(file)}
            </div>
        );
    };

    return (
        <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            {getFilePreview()}
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                </p>
                <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                </p>
            </div>
            
            <button
                onClick={() => onRemove(index)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                title="Remove file"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

const FileUploadModal = ({ isOpen, onClose, files, onFilesChange, onUpload }) => {
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        onFilesChange([...files, ...selectedFiles]);
        e.target.value = ''; // Reset input
    };

    const handleRemoveFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    const handleUpload = () => {
        if (files.length > 0) {
            onUpload(files);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Upload Files</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Upload area */}
                    <DragDropArea
                        onFilesDropped={(droppedFiles) => onFilesChange([...files, ...droppedFiles])}
                        className="mb-6"
                    >
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Drag & drop files here
                            </p>
                            <p className="text-gray-500 mb-4">
                                or click to browse
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                            >
                                Choose Files
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.mp4,.mp3,.wav"
                            />
                        </div>
                    </DragDropArea>

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                                Selected Files ({files.length})
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {files.map((file, index) => (
                                    <FilePreview
                                        key={index}
                                        file={file}
                                        index={index}
                                        onRemove={handleRemoveFile}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={files.length === 0}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                        >
                            Upload {files.length > 0 ? `(${files.length})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { DragDropArea, FilePreview, FileUploadModal };