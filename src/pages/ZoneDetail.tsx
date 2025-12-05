import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Circle, Hexagon, Ship, Calendar, RefreshCw, Edit } from 'lucide-react';
import { Button, Card, Alert, Input } from '../components/ui';
import { ZoneMap } from '../components/map';
import { zoneService } from '../services/zones';
import { CustomZone, Coordinate } from '../types/zone';
import { VesselInZone, TrafficEvent } from '../types/traffic';
import { geoJSONToCoordinates, parseGeoJSONString } from '../utils/validation';

export function ZoneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [zone, setZone] = useState<CustomZone | null>(null);
  const [vessels, setVessels] = useState<VesselInZone[]>([]);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Traffic query params
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [isLoadingVessels, setIsLoadingVessels] = useState(false);

  useEffect(() => {
    if (id) {
      fetchZone();
      fetchVesselsInZone();
    }
  }, [id]);

  const fetchZone = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await zoneService.getZone(id);
      setZone(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch zone');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVesselsInZone = async () => {
    if (!id) return;
    
    setIsLoadingVessels(true);
    
    try {
      const response = await zoneService.getVesselsInZone(id, { limit: 100 });
      setVessels(response.data.vessels);
    } catch (err: any) {
      console.error('Failed to fetch vessels:', err);
    } finally {
      setIsLoadingVessels(false);
    }
  };

  const fetchTraffic = async () => {
    if (!id) return;
    
    setIsLoadingTraffic(true);
    
    try {
      const response = await zoneService.getZoneTraffic(id, {
        timestamp_start: `${startDate}T00:00:00Z`,
        timestamp_end: `${endDate}T23:59:59Z`,
        limit: 100,
      });
      setTrafficEvents(response.data.events);
    } catch (err: any) {
      console.error('Failed to fetch traffic:', err);
    } finally {
      setIsLoadingTraffic(false);
    }
  };

  const getZoneCoordinates = (): Coordinate[] => {
    if (!zone) return [];
    
    if (zone.custom_type === 'POLYGON' && zone.polygon_details) {
      const { geoJSON } = parseGeoJSONString(zone.polygon_details.polygon);
      if (geoJSON && geoJSON.features && geoJSON.features[0]) {
        return geoJSONToCoordinates(geoJSON.features[0].geometry);
      }
    }
    
    return [];
  };

  const getCircleCenter = (): Coordinate | null => {
    if (!zone || zone.custom_type !== 'CIRCULAR' || !zone.circle_details) {
      return null;
    }
    
    return {
      lat: zone.circle_details.latitude,
      lng: zone.circle_details.longitude,
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !zone) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert type="error">
          {error || 'Zone not found'}
        </Alert>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
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
        
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {zone.custom_type === 'CIRCULAR' ? (
              <Circle className="h-8 w-8 text-primary-600 mr-3" />
            ) : (
              <Hexagon className="h-8 w-8 text-primary-600 mr-3" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{zone.name}</h1>
              <p className="text-gray-500">{zone.custom_type} Zone</p>
            </div>
          </div>
          <Link to={`/zones/${zone.id}/edit`}>
            <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
              Edit Zone
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Zone Info and Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Zone Details */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Zone Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Type</dt>
                <dd className="text-sm font-medium text-gray-900">{zone.custom_type}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created By</dt>
                <dd className="text-sm font-medium text-gray-900">{zone.created_by}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created At</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(zone.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last Modified</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(zone.last_modified_at).toLocaleDateString()}
                </dd>
              </div>
              {zone.description && (
                <div className="col-span-2">
                  <dt className="text-sm text-gray-500">Description</dt>
                  <dd className="text-sm font-medium text-gray-900">{zone.description}</dd>
                </div>
              )}
              {zone.custom_type === 'CIRCULAR' && zone.circle_details && (
                <>
                  <div>
                    <dt className="text-sm text-gray-500">Center</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {zone.circle_details.latitude.toFixed(6)}, {zone.circle_details.longitude.toFixed(6)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Radius</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {zone.circle_details.radius.toLocaleString()} meters
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </Card>

          {/* Map */}
          <Card padding="none" className="overflow-hidden">
            <div className="h-[400px]">
              <ZoneMap
                mode={zone.custom_type === 'CIRCULAR' ? 'circular' : 'polygon'}
                circleCenter={getCircleCenter()}
                circleRadius={zone.circle_details?.radius || 1000}
                polygonCoordinates={getZoneCoordinates()}
                isDrawing={false}
              />
            </div>
          </Card>
        </div>

        {/* Right Column - Vessels and Traffic */}
        <div className="space-y-6">
          {/* Vessels Currently in Zone */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Ship className="h-5 w-5 mr-2 text-primary-600" />
                Vessels in Zone
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchVesselsInZone}
                isLoading={isLoadingVessels}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh
              </Button>
            </div>
            
            {vessels.length === 0 ? (
              <p className="text-sm text-gray-500">No vessels currently in this zone</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {vessels.map((vessel, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900">{vessel.vessel_information.name}</p>
                    <p className="text-xs text-gray-500">
                      IMO: {vessel.vessel_information.imo} | MMSI: {vessel.vessel_information.mmsi}
                    </p>
                    <p className="text-xs text-gray-500">
                      {vessel.vessel_information.vessel_type} | {vessel.vessel_information.flag}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Entered: {new Date(vessel.timestamp_entered).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Traffic History */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Traffic History
              </h2>
            </div>
            
            <div className="space-y-3 mb-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button
                onClick={fetchTraffic}
                isLoading={isLoadingTraffic}
                className="w-full"
              >
                Load Traffic
              </Button>
            </div>
            
            {trafficEvents.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {trafficEvents.map((event, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {event.vessel_information.name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.event_details.event_type.includes('ENTRY') || event.event_details.event_type.includes('ARRIVAL')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {event.event_details.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {event.vessel_information.vessel_type} | {event.vessel_information.flag}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.event_details.event_timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
