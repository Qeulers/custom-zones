import api from './api';
import { API_CONFIG } from '../config/api';
import {
  CreateZoneRequest,
  ZoneListResponse,
  ZoneSingleResponse,
  ZoneSearchParams,
} from '../types/zone';
import {
  TrafficResponse,
  VesselsInZoneResponse,
  TrafficQueryParams,
} from '../types/traffic';

export const zoneService = {
  /**
   * Search zones and ports
   */
  async searchZones(params: ZoneSearchParams = {}): Promise<ZoneListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.name_contains) queryParams.append('name_contains', params.name_contains);
    if (params.types) queryParams.append('types', params.types);
    if (params.sub_type) queryParams.append('sub_type', params.sub_type);
    if (params.country_code) queryParams.append('country_code', params.country_code);

    const response = await api.get<ZoneListResponse>(
      `${API_CONFIG.ENDPOINTS.ZONES.LIST}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single zone by ID
   */
  async getZone(id: string): Promise<ZoneSingleResponse> {
    const response = await api.get<ZoneSingleResponse>(
      API_CONFIG.ENDPOINTS.ZONES.SINGLE(id)
    );
    return response.data;
  },

  /**
   * Get custom zones for the current account
   */
  async getCustomZones(params: ZoneSearchParams = {}): Promise<ZoneListResponse> {
    return this.searchZones({
      ...params,
      types: 'Custom',
    });
  },

  /**
   * Create a new custom zone
   */
  async createZone(data: CreateZoneRequest): Promise<ZoneSingleResponse> {
    const response = await api.post<ZoneSingleResponse>(
      API_CONFIG.ENDPOINTS.ZONES.CUSTOM,
      data
    );
    return response.data;
  },

  /**
   * Update an existing custom zone
   */
  async updateZone(id: string, data: CreateZoneRequest): Promise<ZoneSingleResponse> {
    const response = await api.put<ZoneSingleResponse>(
      API_CONFIG.ENDPOINTS.ZONES.CUSTOM_UPDATE(id),
      data
    );
    return response.data;
  },

  /**
   * Get zone traffic events
   */
  async getZoneTraffic(
    id: string,
    params: TrafficQueryParams,
    idType: 'id' | 'unlocode' = 'id'
  ): Promise<TrafficResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    queryParams.append('timestamp_start', params.timestamp_start);
    if (params.timestamp_end) queryParams.append('timestamp_end', params.timestamp_end);
    if (params.event_type) {
      const eventTypes = Array.isArray(params.event_type) 
        ? params.event_type.join(',') 
        : params.event_type;
      queryParams.append('event_type', eventTypes);
    }

    const response = await api.get<TrafficResponse>(
      `${API_CONFIG.ENDPOINTS.ZONES.TRAFFIC(idType, id)}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get vessels currently in a zone
   */
  async getVesselsInZone(
    id: string,
    params: { limit?: number; offset?: number } = {},
    idType: 'id' | 'unlocode' = 'id'
  ): Promise<VesselsInZoneResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get<VesselsInZoneResponse>(
      `${API_CONFIG.ENDPOINTS.ZONES.VESSELS_IN_ZONE(idType, id)}?${queryParams.toString()}`
    );
    return response.data;
  },
};
