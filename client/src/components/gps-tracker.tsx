import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Navigation, Truck, Battery, Clock } from "lucide-react";

interface GpsTrackerProps {
  requestId: number;
  driverId: number;
  isDriver?: boolean;
}

export function GpsTracker({ requestId, driverId, isDriver = false }: GpsTrackerProps) {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [status, setStatus] = useState<string>("en_route");
  const [battery, setBattery] = useState<number>(100);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const watchId = useRef<number | null>(null);
  const { toast } = useToast();

  const trackingMutation = useMutation({
    mutationFn: async (trackingData: any) => {
      return await apiRequest("POST", "/api/gps-tracking", trackingData);
    },
    onSuccess: () => {
      setLastUpdate(new Date());
    },
    onError: (error) => {
      console.error("Error sending GPS data:", error);
      toast({
        title: "Tracking Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your device doesn't support GPS tracking",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed: gpsSpeed, heading: gpsHeading } = position.coords;
        
        setLocation({ latitude, longitude, accuracy });
        if (gpsSpeed !== null) setSpeed(Math.round(gpsSpeed * 3.6)); // Convert m/s to km/h
        if (gpsHeading !== null) setHeading(gpsHeading);

        // Update battery level (simulated since real battery API is limited)
        setBattery(prev => Math.max(prev - 0.1, 0));

        // Send tracking data to server
        trackingMutation.mutate({
          requestId,
          driverId,
          latitude,
          longitude,
          speed: gpsSpeed ? Math.round(gpsSpeed * 3.6) : null,
          heading: gpsHeading,
          accuracy,
          status,
          batteryLevel: Math.round(battery),
        });
      },
      (error) => {
        console.error("GPS Error:", error);
        toast({
          title: "GPS Error",
          description: "Unable to get your location. Please check GPS permissions.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  };

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    if (location) {
      trackingMutation.mutate({
        requestId,
        driverId,
        latitude: location.latitude,
        longitude: location.longitude,
        speed,
        heading,
        accuracy: location.accuracy,
        status: newStatus,
        batteryLevel: Math.round(battery),
      });
    }
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_route": return "bg-blue-100 text-blue-800";
      case "arrived_pickup": return "bg-yellow-100 text-yellow-800";
      case "picked_up": return "bg-orange-100 text-orange-800";
      case "en_route_delivery": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "en_route": return "En Route to Pickup";
      case "arrived_pickup": return "Arrived at Pickup";
      case "picked_up": return "Package Picked Up";
      case "en_route_delivery": return "En Route to Delivery";
      case "delivered": return "Delivered";
      default: return status;
    }
  };

  if (!isDriver) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            GPS tracking will be available when the driver starts the delivery
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Navigation className="mr-2 h-5 w-5" />
            GPS Tracking
          </div>
          <Badge className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tracking Controls */}
        <div className="flex space-x-2">
          {!isTracking ? (
            <Button onClick={startTracking} className="flex-1">
              <MapPin className="mr-2 h-4 w-4" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="outline" className="flex-1">
              Stop Tracking
            </Button>
          )}
        </div>

        {/* Location Information */}
        {location && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Latitude</p>
              <p className="font-mono">{location.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-gray-600">Longitude</p>
              <p className="font-mono">{location.longitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-gray-600">Speed</p>
              <p className="font-medium">{speed} km/h</p>
            </div>
            <div>
              <p className="text-gray-600">Accuracy</p>
              <p className="font-medium">±{Math.round(location.accuracy)}m</p>
            </div>
          </div>
        )}

        {/* Status Controls */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Update Status:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatus("arrived_pickup")}
              disabled={!isTracking}
            >
              Arrived Pickup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatus("picked_up")}
              disabled={!isTracking}
            >
              Picked Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatus("en_route_delivery")}
              disabled={!isTracking}
            >
              En Route Delivery
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatus("delivered")}
              disabled={!isTracking}
            >
              Delivered
            </Button>
          </div>
        </div>

        {/* Device Information */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
          <div className="flex items-center">
            <Battery className="mr-1 h-4 w-4" />
            <span>{Math.round(battery)}%</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}