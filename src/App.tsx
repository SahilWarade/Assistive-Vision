/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { useSpeech } from './hooks/useSpeech';
// In a production app, this would call our custom backend, not Gemini directly.
import { analyzeScene } from './services/gemini';
import { Search, Eye, Map, Languages, Mic, Banknote, Navigation, ArrowLeft, Sun, Moon, Shield, HeartPulse, PhoneCall, Save, Edit2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon missing in React
import L from 'leaflet';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'];

export default function App() {
  const { videoRef, isReady: cameraReady, error: cameraError, captureImage, stream } = useCamera();
  const { speak, listen, stopSpeaking, isListening, isSpeaking } = useSpeech();
  
  const [status, setStatus] = useState('Ready');
  const [processing, setProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  
  // Feature specific states
  const [destination, setDestination] = useState('');
  const [targetObject, setTargetObject] = useState('');

  // Emergency feature states
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    name: 'John Doe',
    age: '35',
    bloodType: 'O+',
    contactName: 'Jane Doe',
    contactPhone: '911'
  });

  // Welcome message
  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Assistive Vision is ready. Single tap to hear a button. Double tap to activate.");
    }, 1000);
    return () => clearTimeout(timer);
  }, [speak]);

  // --- Voice AI Guide Logic ---
  const handleVoiceGuide = async () => {
    stopSpeaking();
    speak("Voice guide active. What would you like to do?");
    setStatus("Listening for command...");
    try {
      const command = await listen();
      const lowerCmd = command.toLowerCase();
      
      if (lowerCmd.includes('navigate')) {
        const dest = lowerCmd.replace('navigate to', '').replace('navigate', '').trim();
        setDestination(dest);
        setCurrentPage('navigate');
        speak(`Navigating to ${dest || 'unknown destination'}. Path clear.`);
      } else if (lowerCmd.includes('find')) {
        const obj = lowerCmd.replace('find object', '').replace('find', '').trim();
        setTargetObject(obj);
        setCurrentPage('find');
        handleFindObject(obj);
      } else if (lowerCmd.includes('describe')) {
        setCurrentPage('describe');
        handleDescribeScene();
      } else if (lowerCmd.includes('currency')) {
        setCurrentPage('currency');
        handleIdentifyCurrency();
      } else if (lowerCmd.includes('language')) {
        setCurrentPage('language');
        speak("Opening language settings.");
      } else if (lowerCmd.includes('emergency')) {
        setCurrentPage('emergency');
        speak("Opening emergency information.");
      } else {
        speak("Command not recognized. Please try again.");
      }
    } catch (err) {
      speak("Could not hear command.");
    }
  };

  // --- Feature Handlers ---
  // Note: In production, these call our backend (e.g., POST /api/v1/vision/describe)
  const handleDescribeScene = async () => {
    if (!cameraReady) { speak("Camera unavailable."); return; }
    setProcessing(true);
    setStatus("Analyzing scene...");
    speak("Analyzing surroundings.");
    try {
      const image = captureImage();
      if (image) {
        // Simulated Backend Proxy Call
        const response = await analyzeScene(image, "Describe the surroundings concisely for a blind person. Mention any immediate obstacles or people. Keep it under 3 sentences.");
        setStatus(response);
        speak(response);
      }
    } catch (e) {
      speak("Service unavailable. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleIdentifyCurrency = async () => {
    if (!cameraReady) { speak("Camera unavailable."); return; }
    setProcessing(true);
    setStatus("Identifying currency...");
    speak("Analyzing currency.");
    try {
      const image = captureImage();
      if (image) {
        // Simulated Backend Proxy Call
        const response = await analyzeScene(image, "Identify the Indian currency note in this image. State only the denomination. If unclear, say 'Currency not clear. Please hold steady.'");
        setStatus(response);
        speak(response);
      }
    } catch (e) {
      speak("Service unavailable. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFindObject = async (objName: string) => {
    if (!cameraReady) { speak("Camera unavailable."); return; }
    setProcessing(true);
    setStatus(`Looking for ${objName}...`);
    try {
      const image = captureImage();
      if (image) {
        // Simulated Backend Proxy Call
        const response = await analyzeScene(image, `Find the ${objName} in this image. Tell me where it is (left, right, center) and approximate distance. Provide hand guidance like 'Move hand right'. If not found, say so. Keep it very short.`);
        setStatus(response);
        speak(response);
      }
    } catch (e) {
      speak("Service unavailable. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const changeLanguage = () => {
    const currentIndex = LANGUAGES.indexOf(currentLanguage);
    const nextLanguage = LANGUAGES[(currentIndex + 1) % LANGUAGES.length];
    setCurrentLanguage(nextLanguage);
    speak(`Switching to ${nextLanguage}.`);
    setStatus(`Language set to ${nextLanguage}`);
  };

  // --- Theme Classes ---
  const bgClass = isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const cardClass = isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900";
  const headerClass = isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const inputClass = isDarkMode ? "bg-gray-800 border-gray-700 text-white focus:ring-white" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-gray-900";

  // --- Render Helpers ---
  const renderHeader = (title: string, showBack = true) => (
    <header className={`p-4 border-b flex justify-between items-center z-10 shadow-sm ${headerClass}`}>
      <div className="w-1/4 flex justify-start">
        {showBack && (
          <button onClick={() => { setCurrentPage('home'); stopSpeaking(); }} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <ArrowLeft className={isDarkMode ? "text-white" : "text-gray-900"} />
          </button>
        )}
      </div>
      <div className="w-2/4 flex flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">{title}</h1>
        {currentPage === 'home' && <p className="text-xs opacity-70 mt-1">Language: {currentLanguage}</p>}
      </div>
      <div className="w-1/4 flex justify-end items-center gap-3">
        {isListening && <Mic className="text-red-500 animate-pulse" size={20} />}
        {isSpeaking && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={() => setCurrentPage('permissions')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <Shield size={20} />
        </button>
      </div>
    </header>
  );

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${bgClass}`}>
      <video ref={videoRef} className="hidden" playsInline muted />

      <AnimatePresence mode="wait">
        {currentPage === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {renderHeader('Assistive Vision', false)}
            
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
              <p className={`text-2xl font-medium leading-relaxed max-w-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {status}
              </p>
              {cameraError && <p className="text-red-500 mt-4 text-sm">Camera Error: {cameraError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 pb-8 overflow-y-auto">
              <AccessibleButton icon={<Map size={36} />} label="Navigate" onActivate={() => { setCurrentPage('navigate'); speak("Navigation opened. Where to?"); }} speak={speak} color={cardClass} />
              <AccessibleButton icon={<Search size={36} />} label="Find Object" onActivate={() => { setCurrentPage('find'); speak("Find object opened. What are you looking for?"); }} speak={speak} color={cardClass} />
              <AccessibleButton icon={<Eye size={36} />} label="Describe Scene" onActivate={() => { setCurrentPage('describe'); handleDescribeScene(); }} speak={speak} disabled={processing} color={cardClass} />
              <AccessibleButton icon={<Banknote size={36} />} label="Currency" onActivate={() => { setCurrentPage('currency'); handleIdentifyCurrency(); }} speak={speak} disabled={processing} color={cardClass} />
              <AccessibleButton icon={<Languages size={36} />} label="Language" onActivate={changeLanguage} speak={speak} color={cardClass} />
              <AccessibleButton icon={<Mic size={36} />} label="Voice Guide" onActivate={() => { setCurrentPage('voice-guide'); speak("Voice Guide opened. Double tap Start to begin."); }} speak={speak} color={isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"} />
              <div className="col-span-2">
                <AccessibleButton icon={<HeartPulse size={36} />} label="Emergency Info" onActivate={() => { setCurrentPage('emergency'); speak("Emergency information opened."); }} speak={speak} color="bg-red-600 text-white border-red-700" />
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === 'navigate' && (
          <motion.div key="navigate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader('Navigation')}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <input 
                type="text" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination..." 
                className={`w-full p-4 text-xl border rounded-xl outline-none ${inputClass}`}
              />
            </div>
            <div className={`flex-1 flex items-center justify-center relative ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} z-0`}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {destination && (
                  <Marker position={[20.5937, 78.9629]}>
                    <Popup>Navigating to: {destination}</Popup>
                  </Marker>
                )}
              </MapContainer>
              {/* Camera Preview Overlay */}
              <div className="absolute bottom-4 right-4 w-32 h-48 bg-gray-900 rounded-xl border-2 border-white shadow-lg flex items-center justify-center overflow-hidden z-10">
                {stream ? <VideoPreview stream={stream} className="w-full h-full" /> : <p className="text-white text-xs text-center px-2">Camera Off</p>}
                <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center py-1">Obstacle Detection</div>
              </div>
            </div>
            <div className={`p-6 border-t ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <AccessibleButton icon={<Navigation size={32} />} label="Start Navigation" onActivate={() => speak(`Navigating to ${destination}. Path clear.`)} speak={speak} color={isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"} />
            </div>
          </motion.div>
        )}

        {currentPage === 'find' && (
          <motion.div key="find" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader('Find Object')}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-2">
              <input 
                type="text" 
                value={targetObject} 
                onChange={(e) => setTargetObject(e.target.value)}
                placeholder="What are you looking for?" 
                className={`flex-1 p-4 text-xl border rounded-xl outline-none ${inputClass}`}
              />
              <button onClick={async () => { const res = await listen(); setTargetObject(res); }} className={`p-4 rounded-xl border ${cardClass}`}>
                <Mic size={24} />
              </button>
            </div>
            <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
               {stream ? <VideoPreview stream={stream} className="w-full h-full absolute inset-0" /> : <p className="text-white text-sm">Camera Off</p>}
            </div>
            <div className={`p-6 border-t min-h-[150px] flex flex-col justify-center ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <p className={`text-xl font-medium text-center mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{status}</p>
              <AccessibleButton icon={<Search size={24} />} label="Scan Now" onActivate={() => handleFindObject(targetObject)} speak={speak} disabled={processing || !targetObject} color={isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"} />
            </div>
          </motion.div>
        )}

        {(currentPage === 'describe' || currentPage === 'currency') && (
          <motion.div key="camera-feature" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader(currentPage === 'describe' ? 'Describe Scene' : 'Identify Currency')}
            <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
               {stream ? <VideoPreview stream={stream} className="w-full h-full absolute inset-0" /> : <p className="text-white text-sm">Camera Off</p>}
            </div>
            <div className={`p-6 border-t min-h-[200px] flex flex-col items-center justify-center gap-6 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <p className={`text-xl font-medium text-center leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{status}</p>
              <AccessibleButton 
                icon={currentPage === 'describe' ? <Eye size={24} /> : <Banknote size={24} />} 
                label="Analyze Again" 
                onActivate={() => currentPage === 'describe' ? handleDescribeScene() : handleIdentifyCurrency()} 
                speak={speak} 
                disabled={processing} 
                color={isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"} 
              />
            </div>
          </motion.div>
        )}

        {currentPage === 'language' && (
          <motion.div key="language" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader('Change Language')}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <input 
                type="text" 
                value={langSearch} 
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="Search language..." 
                className={`w-full p-4 text-xl border rounded-xl outline-none ${inputClass}`}
              />
            </div>
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              {LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase())).map(lang => (
                <AccessibleButton 
                  key={lang}
                  icon={<Languages size={24} />} 
                  label={lang} 
                  onActivate={() => { setCurrentLanguage(lang); speak(`Language set to ${lang}`); setCurrentPage('home'); }} 
                  speak={speak} 
                  color={currentLanguage === lang ? (isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white") : cardClass}
                />
              ))}
            </div>
          </motion.div>
        )}

        {currentPage === 'voice-guide' && (
          <motion.div key="voice-guide" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader('Voice AI Guide')}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-12">
              <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : cardClass}`}>
                <Mic size={80} className={isListening ? 'text-white' : ''} />
              </div>
              <p className={`text-2xl font-medium text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{status}</p>
              <div className="flex gap-4 w-full max-w-md">
                <div className="flex-1">
                  <AccessibleButton icon={<Mic size={28}/>} label="Start" onActivate={handleVoiceGuide} speak={speak} color="bg-green-600 text-white border-green-700" />
                </div>
                <div className="flex-1">
                  <AccessibleButton icon={<Square size={28}/>} label="Stop" onActivate={() => { stopSpeaking(); setStatus("Stopped listening."); }} speak={speak} color="bg-red-600 text-white border-red-700" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === 'emergency' && (
          <motion.div key="emergency" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader('Emergency Info')}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Medical Details</h2>
                <button onClick={() => setIsEditingEmergency(!isEditingEmergency)} className={`p-2 rounded-full ${cardClass}`}>
                  {isEditingEmergency ? <Save size={20} /> : <Edit2 size={20} />}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Full Name</label>
                  {isEditingEmergency ? (
                    <input type="text" value={emergencyData.name} onChange={e => setEmergencyData({...emergencyData, name: e.target.value})} className={`w-full p-3 rounded-lg border ${inputClass}`} />
                  ) : (
                    <p className="text-xl font-semibold">{emergencyData.name}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium opacity-70 mb-1">Age</label>
                    {isEditingEmergency ? (
                      <input type="text" value={emergencyData.age} onChange={e => setEmergencyData({...emergencyData, age: e.target.value})} className={`w-full p-3 rounded-lg border ${inputClass}`} />
                    ) : (
                      <p className="text-xl font-semibold">{emergencyData.age}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium opacity-70 mb-1">Blood Type</label>
                    {isEditingEmergency ? (
                      <input type="text" value={emergencyData.bloodType} onChange={e => setEmergencyData({...emergencyData, bloodType: e.target.value})} className={`w-full p-3 rounded-lg border ${inputClass}`} />
                    ) : (
                      <p className="text-xl font-semibold text-red-500">{emergencyData.bloodType}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold mb-4">Emergency Contact</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium opacity-70 mb-1">Contact Name</label>
                    {isEditingEmergency ? (
                      <input type="text" value={emergencyData.contactName} onChange={e => setEmergencyData({...emergencyData, contactName: e.target.value})} className={`w-full p-3 rounded-lg border ${inputClass}`} />
                    ) : (
                      <p className="text-xl font-semibold">{emergencyData.contactName}</p>
                    )}
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium opacity-70 mb-1">Phone Number</label>
                    {isEditingEmergency ? (
                      <input type="tel" value={emergencyData.contactPhone} onChange={e => setEmergencyData({...emergencyData, contactPhone: e.target.value})} className={`w-full p-3 rounded-lg border ${inputClass}`} />
                    ) : (
                      <p className="text-xl font-semibold">{emergencyData.contactPhone}</p>
                    )}
                  </div>

                  {!isEditingEmergency && (
                    <a 
                      href={`tel:${emergencyData.contactPhone}`} 
                      className="flex items-center justify-center p-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xl transition-colors shadow-lg"
                    >
                      <PhoneCall className="mr-3" size={28} />
                      Call {emergencyData.contactName}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === 'permissions' && (
          <motion.div key="permissions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
            {renderHeader('Permissions')}
            <div className="flex-1 p-6">
              <p className="text-lg mb-6 opacity-80">Manage application permissions required for core features.</p>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex justify-between items-center ${cardClass}`}>
                  <div className="flex items-center gap-3">
                    <Eye className="text-blue-500" />
                    <span className="font-medium">Camera</span>
                  </div>
                  <span className="text-green-500 text-sm font-bold">Granted</span>
                </div>
                <div className={`p-4 rounded-xl border flex justify-between items-center ${cardClass}`}>
                  <div className="flex items-center gap-3">
                    <Mic className="text-purple-500" />
                    <span className="font-medium">Microphone</span>
                  </div>
                  <span className="text-green-500 text-sm font-bold">Granted</span>
                </div>
                <div className={`p-4 rounded-xl border flex justify-between items-center ${cardClass}`}>
                  <div className="flex items-center gap-3">
                    <Map className="text-emerald-500" />
                    <span className="font-medium">Location</span>
                  </div>
                  <span className="text-green-500 text-sm font-bold">Granted</span>
                </div>
              </div>
              <p className="text-sm mt-6 opacity-60 text-center">
                Permissions can be fully managed in your device's system settings.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccessibleButton({ icon, label, onActivate, speak, disabled, color = "bg-white text-gray-900" }: any) {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (clickCount === 1) {
      speak(`${label} button`);
      timer = setTimeout(() => setClickCount(0), 1500);
    } else if (clickCount === 2) {
      if (navigator.vibrate) navigator.vibrate([50]); // Haptic feedback
      onActivate();
      setClickCount(0);
    }
    return () => clearTimeout(timer);
  }, [clickCount, label, speak, onActivate]);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setClickCount(c => c + 1)}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-sm border ${color} ${disabled ? 'opacity-50' : 'active:opacity-80'} transition-colors`}
    >
      <div className="mb-3">{icon}</div>
      <span className="text-lg font-semibold tracking-tight">{label}</span>
    </motion.button>
  );
}

function VideoPreview({ stream, className }: { stream: MediaStream | null, className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className={`object-cover ${className}`} />;
}
