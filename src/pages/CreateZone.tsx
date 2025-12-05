import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, Hexagon, Save, ArrowLeft } from 'lucide-react';
import { Button, Input, Card, Alert, Tabs } from '../components/ui';
import { CircularZoneForm } from '../components/zones/CircularZoneForm';
import { PolygonZoneForm } from '../components/zones/PolygonZoneForm';
import { zoneService } from '../services/zones';
import { Coordinate, ZoneType, CreateZoneRequest } from '../types/zone';
import { 
  validateCircularZone, 
  validatePolygon, 
  coordinatesToGeoJSON,
  isPolygonClosed 
} from '../utils/validation';

export function CreateZonePage() {
  const navigate = useNavigate();
  
  // Zone metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Zone type
  const [zoneType, setZoneType] = useState<ZoneType>('CIRCULAR');
  
  // Circular zone state
  const [circleCenter, setCircleCenter] = useState<Coordinate | null>(null);
  const [circleRadius, setCircleRadius] = useState(1000);
  
  // Polygon zone state
  const [polygonCoordinates, setPolygonCoordinates] = useState<Coordinate[]>([]);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tabs = [
    { id: 'CIRCULAR', label: 'Circular Zone', icon: <Circle className="h-4 w-4" /> },
    { id: 'POLYGON', label: 'Polygon Zone', icon: <Hexagon className="h-4 w-4" /> },
  ];

  const handleTabChange = (tabId: string) => {
    setZoneType(tabId as ZoneType);
    setError(null);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Zone name is required');
    }
    
    if (zoneType === 'CIRCULAR') {
      if (!circleCenter) {
        errors.push('Please set a center point for the circular zone');
      } else {
        const validation = validateCircularZone(circleCenter.lat, circleCenter.lng, circleRadius);
        errors.push(...validation.errors);
      }
    } else {
      if (polygonCoordinates.length < 3) {
        errors.push('Polygon must have at least 3 vertices');
      } else {
        // Ensure polygon is closed for validation
        const closedCoords = [...polygonCoordinates];
        if (!isPolygonClosed(polygonCoordinates)) {
          closedCoords.push(polygonCoordinates[0]);
        }
        const validation = validatePolygon(closedCoords);
        errors.push(...validation.errors);
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    setError(null);
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const request: CreateZoneRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        custom_type: zoneType,
      };
      
      if (zoneType === 'CIRCULAR' && circleCenter) {
        request.circle_details = {
          latitude: circleCenter.lat,
          longitude: circleCenter.lng,
          radius: circleRadius,
        };
      } else if (zoneType === 'POLYGON') {
        const geoJSON = coordinatesToGeoJSON(polygonCoordinates);
        request.polygon_details = {
          format: 'GEOJSON',
          polygon: JSON.stringify(geoJSON),
        };
      }
      
      await zoneService.createZone(request);
      setSuccess(true);
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert type="success" title="Zone Created Successfully!">
          Your custom zone has been created. Redirecting to dashboard...
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Custom Zone</h1>
        <p className="text-gray-500 mt-1">
          Define a new custom zone by drawing on the map or entering coordinates manually
        </p>
      </div>

      {/* Zone Metadata */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zone Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Zone Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter zone name"
            required
          />
          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter zone description"
          />
        </div>
      </Card>

      {/* Zone Type Selection and Form */}
      <Card className="mb-6">
        <Tabs tabs={tabs} defaultTab={zoneType} onChange={handleTabChange}>
          {(activeTab) => (
            <div className="mt-6">
              {activeTab === 'CIRCULAR' ? (
                <CircularZoneForm
                  center={circleCenter}
                  radius={circleRadius}
                  onCenterChange={setCircleCenter}
                  onRadiusChange={setCircleRadius}
                />
              ) : (
                <PolygonZoneForm
                  coordinates={polygonCoordinates}
                  onCoordinatesChange={setPolygonCoordinates}
                />
              )}
            </div>
          )}
        </Tabs>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={isSubmitting}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Create Zone
        </Button>
      </div>
    </div>
  );
}
