import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Truck, Bell, User, LogOut } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type TransportRequest, type Bid } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "accepted": return "bg-green-100 text-green-800";
    case "rejected": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function DriverDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [bidAmounts, setBidAmounts] = useState<{ [key: number]: string }>({});
  const [bidMessages, setBidMessages] = useState<{ [key: number]: string }>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/transport-requests"],
    enabled: !!user,
    retry: false,
  });

  const { data: myBids, isLoading: bidsLoading } = useQuery({
    queryKey: ["/api/bids/driver"],
    enabled: !!user,
    retry: false,
  });

  const createBidMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bids", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bid submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/driver"] });
      setBidAmounts({});
      setBidMessages({});
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit bid",
        variant: "destructive",
      });
    },
  });

  const handleSubmitBid = (requestId: number) => {
    const amount = bidAmounts[requestId];
    const message = bidMessages[requestId];
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      });
      return;
    }

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 2); // Default 2 days

    createBidMutation.mutate({
      requestId,
      amount: parseFloat(amount),
      message: message || "",
      estimatedDelivery: estimatedDelivery.toISOString(),
    });
  };

  if (isLoading || requestsLoading || bidsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="text-primary text-xl" />
                <span className="ml-2 text-xl font-bold text-gray-900">LogiFlow</span>
              </div>
              <div className="ml-8">
                <Badge className="bg-green-100 text-green-800">Driver Portal</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => window.location.href = '/api/logout'}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Available Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No available requests</p>
                  ) : (
                    requests?.map((request: TransportRequest) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">REQ-{request.id}</h3>
                            <p className="text-sm text-gray-600">
                              Pickup: {new Date(request.pickupDate).toLocaleDateString()} at {new Date(request.pickupDate).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Pickup Location</p>
                            <p className="font-medium">{request.pickupLocation}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Delivery Location</p>
                            <p className="font-medium">{request.deliveryLocation}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Weight</p>
                            <p className="font-medium">{request.weight} kg</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Dimensions</p>
                            <p className="font-medium">{request.dimensions}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="text-gray-900">{request.itemDescription}</p>
                        </div>
                        
                        <div className="mb-4">
                          <Textarea
                            placeholder="Optional message for the client..."
                            value={bidMessages[request.id] || ""}
                            onChange={(e) => setBidMessages({ ...bidMessages, [request.id]: e.target.value })}
                            className="mb-2"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Your bid"
                              value={bidAmounts[request.id] || ""}
                              onChange={(e) => setBidAmounts({ ...bidAmounts, [request.id]: e.target.value })}
                              className="w-24"
                            />
                            <span className="text-sm text-gray-600">$</span>
                          </div>
                          <Button
                            onClick={() => handleSubmitBid(request.id)}
                            disabled={createBidMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {createBidMutation.isPending ? "Submitting..." : "Submit Bid"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* My Bids */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">My Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myBids?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No bids yet</p>
                  ) : (
                    myBids?.map((bid: Bid) => (
                      <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">REQ-{bid.requestId}</span>
                          <Badge className={getStatusColor(bid.status)}>
                            {bid.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          My bid: <span className="font-medium">${bid.amount}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted {new Date(bid.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
