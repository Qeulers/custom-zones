import { useState, useEffect, useRef } from 'react';
import { MapPin, Trash2, Upload, MousePointer, Plus, X, FileJson } from 'lucide-react';
import { Input, Button, Alert } from '../ui';
import { ZoneMap } from '../map';
import { Coordinate } from '../../types/zone';
import { 
  validatePolygon, 
  validateGeoJSON, 
  parseGeoJSONString, 
  geoJSONToCoordinates,
  coordinatesToGeoJSON,
  isPolygonClosed 
} from '../../utils/validation';

interface PolygonZoneFormProps {
  coordinates: Coordinate[];
  onCoordinatesChange: (coordinates: Coordinate[]) => void;
}

export function PolygonZoneForm({
  coordinates,
  onCoordinatesChange,
}: PolygonZoneFormProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [geoJSONInput, setGeoJSONInput] = useState('');
  const [showGeoJSONInput, setShowGeoJSONInput] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate on changes
  useEffect(() => {
    if (coordinates.length >= 3) {
      // Ensure polygon is closed for validation
      const closedCoords = [...coordinates];
      if (!isPolygonClosed(coordinates)) {
        closedCoords.push(coordinates[0]);
      }
      const validation = validatePolygon(closedCoords);
      setValidationErrors(validation.errors);
    } else if (coordinates.length > 0) {
      setValidationErrors([`Need at least 3 vertices. Current: ${coordinates.length}`]);
    } else {
      setValidationErrors([]);
    }
  }, [coordinates]);

  const handleAddVertex = () => {
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onCoordinatesChange([...coordinates, { lat, lng }]);
      setNewLat('');
      setNewLng('');
    }
  };

  const handleRemoveVertex = (index: number) => {
    const newCoords = coordinates.filter((_, i) => i !== index);
    onCoordinatesChange(newCoords);
  };

  const handleUpdateVertex = (index: number, field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const newCoords = [...coordinates];
    newCoords[index] = { ...newCoords[index], [field]: numValue };
    onCoordinatesChange(newCoords);
  };

  const handleClearPolygon = () => {
    onCoordinatesChange([]);
    setIsDrawing(false);
    setGeoJSONInput('');
    setUploadError(null);
  };

  const handleGeoJSONImport = () => {
    setUploadError(null);
    
    const { geoJSON, error } = parseGeoJSONString(geoJSONInput);
    if (error) {
      setUploadError(error);
      return;
    }
    
    if (!geoJSON) {
      setUploadError('Failed to parse GeoJSON');
      return;
    }
    
    const validation = validateGeoJSON(geoJSON);
    if (!validation.isValid) {
      setUploadError(validation.errors.join('; '));
      return;
    }
    
    // Extract coordinates from GeoJSON
    const feature = geoJSON.features[0];
    const coords = geoJSONToCoordinates(feature.geometry);
    
    // Remove the closing point if it's the same as the first
    const uniqueCoords = coords.length > 1 && 
      coords[0].lat === coords[coords.length - 1].lat && 
      coords[0].lng === coords[coords.length - 1].lng
      ? coords.slice(0, -1)
      : coords;
    
    onCoordinatesChange(uniqueCoords);
    setShowGeoJSONInput(false);
    setGeoJSONInput('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);
    
    if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
      setUploadError('Please upload a .json or .geojson file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setGeoJSONInput(content);
      setShowGeoJSONInput(true);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportGeoJSON = () => {
    if (coordinates.length < 3) return;
    
    const geoJSON = coordinatesToGeoJSON(coordinates);
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zone.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Form Controls */}
      <div className="space-y-6">
        {/* Drawing Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" />
            Add Vertices
          </h4>
          
          <div className="space-y-4">
            {/* Map Drawing */}
            <Button
              variant={isDrawing ? 'primary' : 'outline'}
              onClick={() => setIsDrawing(!isDrawing)}
              leftIcon={<MousePointer className="h-4 w-4" />}
              className="w-full"
            >
              {isDrawing ? 'Stop Drawing' : 'Click on Map to Add Points'}
            </Button>
            
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            {/* Manual Input Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="w-full"
            >
              Enter Coordinates Manually
            </Button>
            
            {showManualInput && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    placeholder="-90 to 90"
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    placeholder="-180 to 180"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddVertex}
                  disabled={!newLat || !newLng}
                  className="w-full"
                >
                  Add Vertex
                </Button>
              </div>
            )}
            
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            {/* GeoJSON Import */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.geojson"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="h-4 w-4" />}
                className="w-full"
              >
                Upload GeoJSON File
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowGeoJSONInput(!showGeoJSONInput)}
                leftIcon={<FileJson className="h-4 w-4" />}
                className="w-full"
              >
                Paste GeoJSON
              </Button>
            </div>
            
            {showGeoJSONInput && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GeoJSON FeatureCollection
                </label>
                <textarea
                  value={geoJSONInput}
                  onChange={(e) => setGeoJSONInput(e.target.value)}
                  className="w-full h-32 text-sm font-mono border-gray-300 rounded-lg"
                  placeholder='{"type":"FeatureCollection","features":[...]}'
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleGeoJSONImport} className="flex-1">
                    Import
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setShowGeoJSONInput(false);
                      setGeoJSONInput('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {uploadError && (
              <Alert type="error" onClose={() => setUploadError(null)}>
                {uploadError}
              </Alert>
            )}
          </div>
        </div>

        {/* Vertices List */}
        {coordinates.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Vertices ({coordinates.length})
              </h4>
              <div className="flex gap-2">
                {coordinates.length >= 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExportGeoJSON}
                    leftIcon={<FileJson className="h-4 w-4" />}
                  >
                    Export
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearPolygon}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {coordinates.map((coord, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={coord.lat}
                    onChange={(e) => handleUpdateVertex(index, 'lat', e.target.value)}
                    className="flex-1 text-sm border-gray-300 rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    step="any"
                    value={coord.lng}
                    onChange={(e) => handleUpdateVertex(index, 'lng', e.target.value)}
                    className="flex-1 text-sm border-gray-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => handleRemoveVertex(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Validation Rules Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Polygon Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>At least 3 vertices</li>
            <li>Polygon must be closed (first and last points connect)</li>
            <li>No self-intersections</li>
            <li>No holes allowed</li>
            <li>Points must be at least 25 meters apart</li>
          </ul>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="h-[500px] lg:h-auto lg:min-h-[500px]">
        <ZoneMap
          mode="polygon"
          polygonCoordinates={coordinates}
          onPolygonCoordinatesChange={onCoordinatesChange}
          isDrawing={isDrawing}
          className="h-full rounded-lg border border-gray-200"
        />
      </div>
    </div>
  );
}
