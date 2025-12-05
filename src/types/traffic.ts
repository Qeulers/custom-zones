import { Centroid } from './zone';

export type EventType = 
  | 'ZONE_ENTRY' 
  | 'ZONE_EXIT' 
  | 'PORT_AREA_ARRIVAL' 
  | 'PORT_ARRIVAL' 
  | 'PORT_DEPARTURE' 
  | 'PORT_AREA_DEPARTURE';

export interface VesselInformation {
  asset_id: string;
  callsign: string;
  flag: string;
  flag_code: string;
  imo: string;
  mmsi: string;
  name: string;
  vessel_type: string;
}

export interface EventDetails {
  course: number;
  draught: number;
  event_id: string;
  event_timestamp: string;
  event_type: EventType;
  heading: number;
  latitude: number;
  longitude: number;
  speed?: number;
}

export interface TrafficEvent {
  vessel_information: VesselInformation;
  event_details: EventDetails;
}

export interface ZonePortInformation {
  centroid: Centroid;
  country_official_name: string;
  country_code: string;
  description: string;
  id: string;
  name: string;
  sub_type: string;
  type: string;
  unlocode: string;
  country_common_name: string;
  sub_division_code: string;
  sub_division_name: string;
  wpi_number: number | null;
}

export interface TrafficResponse {
  meta: {
    limit: number;
    offset: number;
    total_count: number;
    request_id: string;
    request_timestamp: string;
    zone_version: string;
  };
  data: {
    zone_port_information: ZonePortInformation;
    events: TrafficEvent[];
  };
}

export interface VesselInZone {
  timestamp_entered: string;
  vessel_information: VesselInformation;
}

export interface VesselsInZoneResponse {
  meta: {
    limit: number;
    offset: number;
    total_count: number;
    request_id: string;
    request_timestamp: string;
    zone_version: string;
  };
  data: {
    zone_port_information: ZonePortInformation;
    vessels: VesselInZone[];
  };
}

export interface TrafficQueryParams {
  limit?: number;
  offset?: number;
  timestamp_start: string;
  timestamp_end?: string;
  event_type?: EventType | EventType[];
}
