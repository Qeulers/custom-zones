# Custom Zones UI

A React application for creating and managing custom zones with the Pole Star Zone & Port Insights API.

## Features

- **Authentication**: Secure login with JWT tokens stored in localStorage (1-hour expiry with auto-refresh)
- **Zone Management**: Create, view, and manage custom zones
- **Circular Zones**: Define zones by center point and radius
  - Manual coordinate entry
  - Click on map to set center
  - Drag to set radius
- **Polygon Zones**: Define zones with multiple vertices
  - Manual coordinate entry
  - Click on map to add vertices
  - Upload GeoJSON files
  - Export zones as GeoJSON
- **Polygon Validation**:
  - Minimum 3 vertices required
  - Closed polygon (no gaps)
  - No self-intersections
  - No holes
  - Points must be at least 25 meters apart
- **Zone Traffic**: View vessels currently in zones and historical traffic events

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Leaflet / React-Leaflet** for maps
- **Turf.js** for geospatial calculations
- **Axios** for API requests
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

| Variable            | Description            | Default                          |
| ------------------- | ---------------------- | -------------------------------- |
| `VITE_API_BASE_URL` | Pole Star API base URL | `https://api.polestarglobal.com` |

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components (Header, Layout)
│   ├── map/           # Map components (ZoneMap)
│   ├── ui/            # Reusable UI components
│   └── zones/         # Zone creation forms
├── config/            # Configuration files
├── contexts/          # React contexts (AuthContext)
├── pages/             # Page components
├── services/          # API services
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## API Endpoints Used

- `POST /account/v2/auth/signin` - User authentication
- `PUT /account/v1/auth/access-token-refresh` - Token refresh
- `GET /zone-port-insights/v1/zones` - List zones
- `GET /zone-port-insights/v1/zones/:id` - Get zone details
- `POST /zone-port-insights/v1/zones/custom` - Create custom zone
- `PUT /zone-port-insights/v1/zones/custom/:id` - Update custom zone
- `GET /zone-port-insights/v1/zone-and-port-traffic/:id_type/:id` - Get zone traffic
- `GET /zone-port-insights/v1/vessels-in-zone-or-port/:id_type/:id` - Get vessels in zone

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

Proprietary - Pole Star Global
