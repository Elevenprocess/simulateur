import { useState, useEffect, useRef } from "react";
import { useSimulatorStore } from "@/store/simulator";
import { Button } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = "AIzaSyB-cjtQhRBqh2JZfo7T5-0gXhzptV4YE7I";

interface AddressStepProps {
  variant?: any;
  analytics?: any;
}

export function AddressStep({ variant, analytics }: AddressStepProps) {
  const { address, setAddress, setStep } = useSimulatorStore();
  const [inputValue, setInputValue] = useState(address.formatted);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        await loader.load();

        if (inputRef.current) {
          // Initialize autocomplete
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: "re" }, // Restrict to La Réunion
            fields: ["formatted_address", "geometry", "name", "address_components"],
            types: ["address"]
          });

          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();
            if (place && place.geometry?.location) {
              setSelectedPlace(place);
              setInputValue(place.formatted_address || place.name || "");
              
              // Update map
              if (mapInstanceRef.current) {
                const location = place.geometry.location;
                mapInstanceRef.current.setCenter(location);
                mapInstanceRef.current.setZoom(20);
                
                // Add marker
                new google.maps.Marker({
                  position: location,
                  map: mapInstanceRef.current,
                  title: place.formatted_address || place.name
                });
              }
            }
          });
        }

        // Initialize map
        if (mapRef.current) {
          const defaultLocation = { lat: -21.1151, lng: 55.5364 }; // La Réunion center
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: defaultLocation,
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initializeGoogleMaps();
  }, []);

  const handleAddressSubmit = async () => {
    if (!selectedPlace?.geometry?.location) {
      if (!inputValue.trim()) return;
      alert("Veuillez sélectionner une adresse dans la liste des suggestions.");
      return;
    }

    setIsValidating(true);
    
    const location = selectedPlace.geometry.location;
    const components = selectedPlace.address_components || [];
    const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name || '';
    const streetNumber = get('street_number');
    const route = get('route');
    const street = [streetNumber, route].filter(Boolean).join(' ') || (selectedPlace.name || '');
    const city = get('locality') || get('postal_town') || get('administrative_area_level_2') || '';
    const postalCode = get('postal_code') || '';
    const coords = {
      formatted: selectedPlace.formatted_address || inputValue,
      street,
      city,
      postalCode,
      lat: location.lat(),
      lng: location.lng(),
    };
    
    analytics?.trackButtonClick('Adresse validée', { step: 'address' }, variant?.id);
    
    setTimeout(() => {
      setAddress(coords);
      setIsValidating(false);
      setStep(4); // Go to loading step
    }, 500);
  };

// Geolocation disabled per request

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Question */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <MapPin className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-h2 text-foreground">
            Où se trouve votre logement ?
          </h2>
          <p className="text-body text-muted-foreground">
            Nous utilisons cette information pour calculer le potentiel solaire de votre toit
          </p>
        </motion.div>

        {/* Address input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Saisissez votre adresse complète"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-12 text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSubmit()}
            />
            <p className="text-small text-muted-foreground">
              Exemple : 123 Route des Tamarins, Saint-Pierre
            </p>
          </div>

          <Button
            variant="cta"
            onClick={handleAddressSubmit}
            disabled={!inputValue.trim() || isValidating}
            className="w-full"
          >
            {isValidating ? "Validation en cours..." : "Continuer"}
          </Button>
        </motion.div>

{/* Current location option removed per request */}

        {/* Google Maps satellite view */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <div
            ref={mapRef}
            className="w-full h-64 rounded-lg border shadow-sm"
            style={{ minHeight: "256px" }}
          />
          {selectedPlace && (
            <div className="text-center">
              <p className="text-small text-muted-foreground">
                📍 {selectedPlace.formatted_address || selectedPlace.name}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}