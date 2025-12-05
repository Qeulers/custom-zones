import { useState, useEffect } from 'react';
import { MapPin, Circle, MousePointer } from 'lucide-react';
import { Input, Button, Alert } from '../ui';
import { ZoneMap } from '../map';
import { Coordinate } from '../../types/zone';
import { validateCircularZone } from '../../utils/validation';

interface CircularZoneFormProps {
  center: Coordinate | null;
  radius: number;
  onCenterChange: (center: Coordinate | null) => void;
  onRadiusChange: (radius: number) => void;
}

export function CircularZoneForm({
  center,
  radius,
  onCenterChange,
  onRadiusChange,
}: CircularZoneFormProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualRadius, setManualRadius] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sync manual inputs with props
  useEffect(() => {
    if (center) {
      setManualLat(center.lat.toFixed(6));
      setManualLng(center.lng.toFixed(6));
    }
  }, [center]);

  useEffect(() => {
    setManualRadius(radius.toString());
  }, [radius]);

  // Validate on changes
  useEffect(() => {
    if (center) {
      const validation = validateCircularZone(center.lat, center.lng, radius);
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  }, [center, radius]);

  const handleManualCenterSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      onCenterChange({ lat, lng });
    }
  };

  const handleManualRadiusSubmit = () => {
    const r = parseFloat(manualRadius);
    if (!isNaN(r) && r > 0) {
      onRadiusChange(r);
    }
  };

  const handleClearZone = () => {
    onCenterChange(null);
    onRadiusChange(1000);
    setManualLat('');
    setManualLng('');
    setManualRadius('1000');
    setIsDrawing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Form Controls */}
      <div className="space-y-6">
        {/* Center Point Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" />
            Center Point
          </h4>
          
          <div className="space-y-4">
            {/* Manual Input */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                onBlur={handleManualCenterSubmit}
                placeholder="-90 to 90"
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                onBlur={handleManualCenterSubmit}
                placeholder="-180 to 180"
              />
            </div>
            
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            <Button
              variant={isDrawing ? 'primary' : 'outline'}
              onClick={() => setIsDrawing(!isDrawing)}
              leftIcon={<MousePointer className="h-4 w-4" />}
              className="w-full"
            >
              {isDrawing ? 'Stop Drawing' : 'Click on Map to Set Center'}
            </Button>
          </div>
        </div>

        {/* Radius Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Circle className="h-5 w-5 mr-2 text-primary-600" />
            Radius
          </h4>
          
          <div className="space-y-4">
            <Input
              label="Radius (meters)"
              type="number"
              min="1"
              value={manualRadius}
              onChange={(e) => setManualRadius(e.target.value)}
              onBlur={handleManualRadiusSubmit}
              helperText={`${(radius / 1000).toFixed(2)} km | ${(radius / 1852).toFixed(2)} nautical miles`}
            />
            
            {/* Quick radius buttons */}
            <div className="flex flex-wrap gap-2">
              {[1000, 5000, 10000, 50000, 100000].map((r) => (
                <button
                  key={r}
                  onClick={() => onRadiusChange(r)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    radius === r
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
            
            {isDrawing && center && (
              <p className="text-sm text-gray-500">
                Tip: Click and drag on the map to adjust the radius
              </p>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert type="error" title="Validation Errors">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Current Values Summary */}
        {center && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Current Zone</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Center: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</p>
              <p>Radius: {radius.toLocaleString()} meters</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearZone}
              className="mt-3 text-blue-700 hover:text-blue-900"
            >
              Clear Zone
            </Button>
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="h-[500px] lg:h-auto lg:min-h-[500px]">
        <ZoneMap
          mode="circular"
          circleCenter={center}
          circleRadius={radius}
          onCircleCenterChange={onCenterChange}
          onCircleRadiusChange={onRadiusChange}
          isDrawing={isDrawing}
          className="h-full rounded-lg border border-gray-200"
        />
      </div>
    </div>
  );
}
