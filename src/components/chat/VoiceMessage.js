// frontend/src/components/chat/VoiceMessage.js
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Send, X, Volume2 } from 'lucide-react';

const VoiceRecorder = ({ onSend, onCancel, isOpen }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [waveformData, setWaveformData] = useState([]);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const intervalRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setIsRecording(false);
            setRecordingTime(0);
            setAudioBlob(null);
            setAudioUrl(null);
            setIsPlaying(false);
            setPlaybackTime(0);
            setDuration(0);
            setWaveformData([]);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            // Set up audio analysis for waveform
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserRef.current = analyser;
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                const url = URL.createObjectURL(audioBlob);
                
                setAudioBlob(audioBlob);
                setAudioUrl(url);
                
                // Create audio element to get duration
                const audio = new Audio(url);
                audio.onloadedmetadata = () => {
                    setDuration(audio.duration);
                };
                audio.load(); // Ensure audio loads
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
            // Start waveform animation
            drawWaveform();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(intervalRef.current);
            cancelAnimationFrame(animationRef.current);
        }
    };

    const drawWaveform = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            
            analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;
                
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#8b5cf6');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    };

    const playAudio = () => {
        if (audioUrl && audioRef.current) {
            audioRef.current.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            setIsPlaying(true);
            
            // Update playback time
            const updateTime = () => {
                if (audioRef.current) {
                    setPlaybackTime(audioRef.current.currentTime);
                    if (!audioRef.current.paused) {
                        requestAnimationFrame(updateTime);
                    }
                }
            };
            updateTime();
        }
    };

    const pauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob, duration);
            // Clean up blob URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            // Reset state
            setAudioBlob(null);
            setAudioUrl(null);
            setDuration(0);
            setRecordingTime(0);
            setPlaybackTime(0);
            setIsPlaying(false);
            onCancel();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Voice Message</h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Recording/Playback Area */}
                <div className="mb-6">
                    {isRecording ? (
                        <div className="text-center">
                            <div className="mb-4">
                                <canvas
                                    ref={canvasRef}
                                    width={300}
                                    height={100}
                                    className="w-full h-20 bg-gray-100 rounded-lg"
                                />
                            </div>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-lg font-mono text-gray-900">
                                    {formatTime(recordingTime)}
                                </span>
                            </div>
                        </div>
                    ) : audioBlob ? (
                        <div className="text-center">
                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <Volume2 className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Voice message ({formatTime(duration)})
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(playbackTime / duration) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{formatTime(playbackTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                            <audio
                                ref={audioRef}
                                src={audioUrl || ''}
                                onEnded={() => setIsPlaying(false)}
                                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                                onTimeUpdate={() => setPlaybackTime(audioRef.current?.currentTime || 0)}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mic className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="text-gray-600">Tap to start recording</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-center space-x-4">
                    {!audioBlob ? (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
                                isRecording
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                            }`}
                        >
                            {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={isPlaying ? pauseAudio : playAudio}
                                className="p-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={() => {
                                    if (audioUrl) {
                                        URL.revokeObjectURL(audioUrl);
                                    }
                                    setAudioBlob(null);
                                    setAudioUrl(null);
                                    setDuration(0);
                                    setPlaybackTime(0);
                                    setIsPlaying(false);
                                }}
                                className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                            >
                                <MicOff className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleSend}
                                className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* Recording hint */}
                {!isRecording && !audioBlob && (
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                            Hold and speak clearly for best quality
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VoiceMessagePlayer = ({ audioUrl, duration, isOwn }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);
    const [audioError, setAudioError] = useState(false);
    const audioRef = useRef(null);

    // Handle audio loading error
    const handleAudioError = () => {
        setAudioError(true);
        console.error('Audio playback error for URL:', audioUrl);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayback = () => {
        if (audioRef.current && !audioError) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(error => {
                    console.error('Error playing audio:', error);
                    setAudioError(true);
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setTotalDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleSeek = (e) => {
        const progressBar = e.currentTarget;
        const clickX = e.nativeEvent.offsetX;
        const width = progressBar.offsetWidth;
        const newTime = (clickX / width) * totalDuration;
        
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    if (audioError) {
        return (
            <div className={`flex items-center space-x-3 p-3 rounded-2xl ${
                isOwn ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white border border-gray-200'
            } shadow-md max-w-xs`}>
                <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-medium opacity-90">
                        Voice message (playback error)
                    </span>
                </div>
            </div>
        );
    }

    if (!audioUrl) {
        return (
            <div className={`flex items-center space-x-3 p-3 rounded-2xl ${
                isOwn ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white border border-gray-200'
            } shadow-md max-w-xs`}>
                <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-medium opacity-90">
                        🎤 Voice message
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-3 p-3 rounded-2xl ${
            isOwn ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white border border-gray-200'
        } shadow-md max-w-xs`}>
            <button
                onClick={togglePlayback}
                disabled={audioError}
                className={`p-2 rounded-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOwn 
                        ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                }`}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-medium opacity-90">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </span>
                </div>
                
                <div 
                    className="w-full bg-black bg-opacity-20 rounded-full h-2 mt-2 cursor-pointer"
                    onClick={handleSeek}
                >
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                            isOwn ? 'bg-white bg-opacity-80' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                    ></div>
                </div>
            </div>
            
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={handleAudioError}
                preload="metadata"
            />
        </div>
    );
};

export { VoiceRecorder, VoiceMessagePlayer };