import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Truck, Clock, RefreshCw } from "lucide-react";
import type { GpsTracking } from "@shared/schema";

interface TrackingMapProps {
  requestId: number;
  pickupLocation: string;
  deliveryLocation: string;
}

export function TrackingMap({ requestId, pickupLocation, deliveryLocation }: TrackingMapProps) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [liveLocation, setLiveLocation] = useState<GpsTracking | null>(null);

  const { data: trackingHistory, refetch } = useQuery({
    queryKey: ["/api/gps-tracking", requestId],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("Connected to tracking WebSocket");
      websocket.send(JSON.stringify({
        type: 'subscribe_tracking',
        requestId: requestId
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'location_update' && data.requestId === requestId) {
          setLiveLocation(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from tracking WebSocket");
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [requestId]);

  const latestLocation = liveLocation || (Array.isArray(trackingHistory) && trackingHistory.length > 0 ? trackingHistory[0] : null);

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

  const openInMaps = () => {
    if (latestLocation) {
      const url = `https://maps.google.com/maps?q=${latestLocation.latitude},${latestLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Live Tracking
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Information */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
            <div>
              <p className="text-sm text-gray-600">Pickup Location</p>
              <p className="font-medium">{pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
            <div>
              <p className="text-sm text-gray-600">Delivery Location</p>
              <p className="font-medium">{deliveryLocation}</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {latestLocation ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(latestLocation.status)}>
                {getStatusText(latestLocation.status)}
              </Badge>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="mr-1 h-4 w-4" />
                {new Date(latestLocation.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* Driver Location */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Truck className="mr-2 h-4 w-4 text-blue-600" />
                <span className="font-medium">Driver Location</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Coordinates</p>
                  <p className="font-mono text-xs">
                    {Number(latestLocation.latitude).toFixed(4)}, {Number(latestLocation.longitude).toFixed(4)}
                  </p>
                </div>
                {latestLocation.speed && (
                  <div>
                    <p className="text-gray-600">Speed</p>
                    <p className="font-medium">{Number(latestLocation.speed).toFixed(0)} km/h</p>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={openInMaps}
              >
                <MapPin className="mr-2 h-4 w-4" />
                View on Maps
              </Button>
            </div>

            {/* Progress Timeline */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Delivery Progress</p>
              <div className="space-y-1">
                <div className={`flex items-center text-sm ${
                  ['arrived_pickup', 'picked_up', 'en_route_delivery', 'delivered'].includes(latestLocation.status) 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    ['arrived_pickup', 'picked_up', 'en_route_delivery', 'delivered'].includes(latestLocation.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  Arrived at pickup location
                </div>
                <div className={`flex items-center text-sm ${
                  ['picked_up', 'en_route_delivery', 'delivered'].includes(latestLocation.status) 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    ['picked_up', 'en_route_delivery', 'delivered'].includes(latestLocation.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  Package picked up
                </div>
                <div className={`flex items-center text-sm ${
                  ['en_route_delivery', 'delivered'].includes(latestLocation.status) 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    ['en_route_delivery', 'delivered'].includes(latestLocation.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  En route to delivery
                </div>
                <div className={`flex items-center text-sm ${
                  latestLocation.status === 'delivered' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    latestLocation.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  Package delivered
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Truck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No tracking data available yet</p>
            <p className="text-sm">Tracking will begin when the driver starts the delivery</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}