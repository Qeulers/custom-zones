import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MapPin, Circle, Hexagon, RefreshCw, Eye } from 'lucide-react';
import { Button, Input, Card, Alert } from '../components/ui';
import { zoneService } from '../services/zones';
import { ZoneSearchResult } from '../types/zone';

export function DashboardPage() {
  const [zones, setZones] = useState<ZoneSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchZones = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await zoneService.getCustomZones({
        limit: 100,
        offset: 0,
        name_contains: searchQuery || undefined,
      });
      setZones(response.data);
      setTotalCount(response.meta.total_count);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch zones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchZones();
  };

  const getZoneIcon = (subType: string) => {
    if (subType === 'CIRCULAR' || subType === 'Circular') {
      return <Circle className="h-5 w-5 text-primary-600" />;
    }
    return <Hexagon className="h-5 w-5 text-primary-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Zones</h1>
          <p className="text-gray-500 mt-1">
            Manage your custom zones and view zone traffic
          </p>
        </div>
        <Link to="/zones/create" className="mt-4 sm:mt-0">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Zone
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search zones by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              fetchZones();
            }}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Reset
          </Button>
        </form>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && zones.length === 0 && (
        <Card className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Zones</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? 'No zones match your search criteria'
              : "You haven't created any custom zones yet"}
          </p>
          {!searchQuery && (
            <Link to="/zones/create">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Create Your First Zone
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Zones Grid */}
      {!isLoading && zones.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-500">
            Showing {zones.length} of {totalCount} zones
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getZoneIcon(zone.sub_type)}
                    <span className="ml-2 text-xs font-medium text-gray-500 uppercase">
                      {zone.sub_type}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {zone.name}
                </h3>
                
                {zone.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {zone.description}
                  </p>
                )}
                
                <div className="text-xs text-gray-400 mb-4">
                  <p>
                    Center: {zone.centroid.latitude.toFixed(4)}, {zone.centroid.longitude.toFixed(4)}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/zones/${zone.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Eye className="h-4 w-4" />}>
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
