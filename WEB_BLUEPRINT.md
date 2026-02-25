# Assistive Vision – Web-Based Voice AI Navigation System (Free Map Stack)

## 1. Complete Frontend Folder Structure (Vite + React)

```text
assistive-vision-web/
├── public/
│   ├── manifest.json         # PWA configuration
│   └── icons/                # App icons
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AccessibleButton.tsx
│   │   ├── VideoPreview.tsx
│   │   └── MapView.tsx       # Leaflet Map component
│   ├── hooks/                # Custom React hooks
│   │   ├── useCamera.ts      # getUserMedia handling
│   │   ├── useSpeech.ts      # Web Speech API wrapper
│   │   └── useLocation.ts    # Geolocation API wrapper
│   ├── services/             # API integrations
│   │   ├── backendProxy.ts   # Calls to our Node.js backend
│   │   └── routingService.ts # OpenRouteService API calls
│   ├── App.tsx               # Main application routing & state
│   ├── index.css             # Tailwind CSS entry
│   └── main.tsx              # React DOM render
├── .env.example              # VITE_BACKEND_URL, VITE_ORS_API_KEY
├── package.json              # Dependencies (leaflet, react-leaflet, etc.)
├── tailwind.config.js        # Tailwind configuration
└── vite.config.ts            # Vite configuration
```

## 2. Leaflet + OpenStreetMap Integration Example

```tsx
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function MapView({ userLocation, routeCoordinates }) {
  return (
    <MapContainer 
      center={userLocation || [20.5937, 78.9629]} 
      zoom={15} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false} // Disable zoom controls for cleaner UI
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && <Marker position={userLocation} />}
      {routeCoordinates.length > 0 && (
        <Polyline positions={routeCoordinates} color="blue" weight={5} />
      )}
    </MapContainer>
  );
}
```

## 3. OpenRouteService Routing Example

```typescript
// src/services/routingService.ts
export async function getRoute(startCoords: [number, number], endCoords: [number, number]) {
  // ORS expects coordinates in [longitude, latitude] format
  const start = `${startCoords[1]},${startCoords[0]}`;
  const end = `${endCoords[1]},${endCoords[0]}`;
  
  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${import.meta.env.VITE_ORS_API_KEY}&start=${start}&end=${end}`
  );
  
  if (!response.ok) throw new Error("Routing failed");
  
  const data = await response.json();
  // Convert [lon, lat] back to [lat, lon] for Leaflet Polyline
  const coordinates = data.features[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
  const instructions = data.features[0].properties.segments[0].steps;
  
  return { coordinates, instructions };
}
```

## 4. Backend Proxy Structure (Node.js / Express)

```text
assistive-vision-backend/
├── src/
│   ├── controllers/
│   │   ├── visionController.js  # Handles Gemini API calls
│   │   └── voiceController.js   # Handles Sarvam API calls
│   ├── middlewares/
│   │   ├── rateLimiter.js       # Express-rate-limit
│   │   └── errorHandler.js      # Global error handling
│   ├── routes/
│   │   └── api.js               # Express router
│   └── server.js                # Express app setup
├── .env                         # GEMINI_API_KEY, SARVAM_API_KEY
└── package.json
```

## 5. Gemini API Backend Integration Example

```javascript
// src/controllers/visionController.js
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.analyzeImage = async (req, res, next) => {
  try {
    const { base64Image, prompt } = req.body;
    
    // Strip the data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
        prompt
      ]
    });
    
    res.json({ result: response.text });
  } catch (error) {
    next(error);
  }
};
```

## 6. Sarvam API Integration Example

```javascript
// src/controllers/voiceController.js
const axios = require('axios');

exports.generateSpeech = async (req, res, next) => {
  try {
    const { text, languageCode } = req.body;
    
    const response = await axios.post('https://api.sarvam.ai/v1/text-to-speech', {
      text: text,
      language_code: languageCode,
      speaker: "meera"
    }, {
      headers: { 'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` },
      responseType: 'arraybuffer'
    });
    
    res.set('Content-Type', 'audio/wav');
    res.send(response.data);
  } catch (error) {
    next(error);
  }
};
```

## 7. Mobile-First Responsive CSS Layout

The app uses Tailwind CSS for a highly responsive, mobile-first layout. Key classes used:
- `min-h-screen flex flex-col`: Ensures the app takes up the full viewport height without scroll jank.
- `flex-1 overflow-y-auto`: Allows content areas to scroll independently while keeping headers/footers fixed.
- `grid grid-cols-2 gap-4`: Creates a touch-friendly grid for the main menu buttons.
- `absolute inset-0 object-cover`: Ensures the camera preview fills its container perfectly without distortion.
- `z-0` and `z-10`: Manages stacking contexts, ensuring the camera overlay sits above the Leaflet map.

## 8. Performance Optimization Checklist

- [x] **Lazy Loading**: Use `React.lazy()` for heavy components like the Leaflet Map to ensure the initial JS bundle remains small.
- [x] **Camera Throttling**: Only capture frames when the user explicitly requests an analysis, rather than streaming continuously to the backend.
- [x] **Debounced GPS**: Throttle `navigator.geolocation.watchPosition` updates to once every 2 seconds to save battery and prevent UI stutter.
- [x] **Image Compression**: Downscale images to 640x640 and use `image/jpeg` at 0.8 quality before sending to the backend to reduce payload size.
- [x] **No Main Thread Blocking**: Use Web Workers for any heavy client-side processing (if added later) and rely on CSS transforms (`motion/react`) for animations.

## 9. Deployment Instructions for Vercel

1. Push the frontend code to a GitHub repository.
2. Log in to Vercel and click "Add New Project".
3. Import the GitHub repository.
4. Vercel will automatically detect the Vite framework.
5. In the "Environment Variables" section, add:
   - `VITE_BACKEND_URL` (pointing to your deployed Node.js proxy)
   - `VITE_ORS_API_KEY` (your free OpenRouteService key)
6. Click "Deploy". The app will be live with a global CDN and automatic HTTPS.

## 10. Future Android Conversion Strategy

To convert this web application into a native Android app in the future, the recommended approach is **Capacitor.js**:

1. **Why Capacitor?** It allows you to take this exact Vite + React codebase and wrap it in a native Android WebView. You don't need to rewrite the UI in Kotlin or React Native.
2. **Native Plugins**: Capacitor provides official plugins for native features:
   - `@capacitor/camera` (for more robust camera control)
   - `@capacitor/geolocation` (for background GPS tracking)
   - `@capacitor/haptics` (for native vibration)
3. **Migration Steps**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android # Opens in Android Studio
   ```
4. **Alternative (React Native)**: If maximum performance is required (e.g., running TFLite models directly on-device at 30fps), a full rewrite in React Native using `react-native-vision-camera` and `react-native-maps` would be the next step.
