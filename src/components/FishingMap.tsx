import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "./LeafletFix";

// Sample fishing spots data
const sampleSpots = [
  {
    id: 1,
    name: "Bali Reef",
    lat: -8.409518,
    lng: 115.188919,
    description: "Great for reef fishing, abundant parrotfish",
    rating: 4.5,
  },
  {
    id: 2,
    name: "Lake Toba",
    lat: 2.6158,
    lng: 98.8321,
    description: "Freshwater fishing, famous for Batak fish",
    rating: 4.8,
  },
  {
    id: 3,
    name: "Raja Ampat",
    lat: -0.5897,
    lng: 130.6754,
    description: "World-class sport fishing destination",
    rating: 5.0,
  },
];

// Custom fishing marker icon
const fishingIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Indonesia boundary coordinates (rough approximation)
const indonesiaBounds = {
  north: 6.2, // Northern limit
  south: -11.1, // Southern limit
  west: 94.7, // Western limit
  east: 141.0, // Eastern limit
};

// Check if coordinates are within Indonesia's boundaries
function isInIndonesia(lat: any, lng: any) {
  return (
    lat >= indonesiaBounds.south &&
    lat <= indonesiaBounds.north &&
    lng >= indonesiaBounds.west &&
    lng <= indonesiaBounds.east
  );
}

// Component to handle location finding and map updates
function LocationMarker() {
  const [position, setPosition] = useState<any>(null);
  const [locationFound, setLocationFound] = useState(false);
  const map = useMap();

  useEffect(() => {
    // Try to get user's current location
    map
      .locate()
      .on("locationfound", function (e) {
        const { lat, lng } = e.latlng;

        // Check if user is in Indonesia
        if (isInIndonesia(lat, lng)) {
          setPosition([lat, lng]);
          map.flyTo([lat, lng], 10);
        } else {
          // If user is not in Indonesia, just center on Indonesia
          map.setView([-2.5489, 118.0149], 5);
        }
        setLocationFound(true);
      })
      .on("locationerror", function (e) {
        console.log("Location access denied or unavailable", e);
        // Default to Indonesia center if location access is denied
        map.setView([-2.5489, 118.0149], 5);
        setLocationFound(true);
      });
  }, [map]);

  return position === null ? null : (
    <Marker position={position} icon={fishingIcon}>
      <Popup>
        <div className="text-center">
          <h3 className="font-bold text-lg">Your Location</h3>
          <p className="my-1">You are here!</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function FishingMap() {
  const [fishingSpots, setFishingSpots] = useState(sampleSpots);
  const [loading, setLoading] = useState(true);

  // Indonesia center coordinates (default)
  const indonesiaCenter = [-2.5489, 118.0149];
  const defaultZoom = 5;

  useEffect(() => {
    // Set loading to false after component mounts
    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-3xl font-bold my-4 text-blue-700">
        Indonesia Fishing Spots
      </h1>

      <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-blue-500 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-xl text-blue-700">Loading map...</p>
          </div>
        ) : (
          <MapContainer
            center={[indonesiaCenter[0], indonesiaCenter[1]]}
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            maxBounds={[
              [indonesiaBounds.south - 5, indonesiaBounds.west - 5], // Southwest corner
              [indonesiaBounds.north + 5, indonesiaBounds.east + 5], // Northeast corner
            ]}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Component that handles user location */}
            <LocationMarker />

            {/* Render fishing spot markers */}
            {fishingSpots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lng]}
                icon={fishingIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{spot.name}</h3>
                    <p className="my-1">{spot.description}</p>
                    <p className="text-yellow-500">
                      {"★".repeat(Math.floor(spot.rating))}
                      {spot.rating % 1 >= 0.5 ? "½" : ""}
                      {"☆".repeat(5 - Math.ceil(spot.rating))}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="mt-4 text-gray-600">
        <p>
          Map will initially locate you if you're in Indonesia, otherwise it
          shows the whole country
        </p>
      </div>
    </div>
  );
}
