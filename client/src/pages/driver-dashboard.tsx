import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Bell, User, LogOut, Mail, Phone, Calendar, Star, CheckCircle, Clock } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("dashboard");
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
        window.location.href = "/login";
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
      amount: parseFloat(amount), // Send as number, server will convert to string
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
                <span className="ml-2 text-xl font-bold text-gray-900">MyTransporter</span>
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
              <Button variant="ghost" size="icon" onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                  window.location.href = '/';
                });
              }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Available Requests */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Available Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                <div className="space-y-4">
                  {Array.isArray(requests) && requests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No available requests</p>
                  ) : Array.isArray(requests) ? (
                    requests.map((request: TransportRequest) => (
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
                  ) : (
                    <p className="text-gray-500 text-center py-8">Loading requests...</p>
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
                  {Array.isArray(myBids) && myBids.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No bids yet</p>
                  ) : Array.isArray(myBids) ? (
                    myBids.map((bid: Bid) => (
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
                  ) : (
                    <p className="text-gray-500 text-center py-8">Loading bids...</p>
                  )}
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">My Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="text-white text-3xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-gray-600">Professional Driver</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600">4.5/5 rating • Driver since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2023'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">{user?.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">+1 (555) 123-4567</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-4">Performance Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-green-700 mb-1">Total Bids</p>
                        <p className="text-2xl font-bold text-green-900">{Array.isArray(myBids) ? myBids.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 mb-1">Accepted Bids</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {Array.isArray(myBids) ? myBids.filter(b => b.status === 'accepted').length : 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 mb-1">Success Rate</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {Array.isArray(myBids) && myBids.length > 0 
                            ? Math.round((myBids.filter(b => b.status === 'accepted').length / myBids.length) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4">Vehicle Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Vehicle Type</p>
                        <p className="font-medium text-blue-900">2019 Ford Transit</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">License Plate</p>
                        <p className="font-medium text-blue-900">TRK123</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Max Capacity</p>
                        <p className="font-medium text-blue-900">2,500 kg</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Bid History */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent Bid Activity</h4>
                    <div className="space-y-4">
                      {Array.isArray(myBids) && myBids.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No bids submitted yet</p>
                          <p className="text-sm text-gray-400">Start bidding on available requests to build your profile</p>
                        </div>
                      ) : Array.isArray(myBids) ? (
                        myBids.slice(0, 3).map((bid: Bid) => (
                          <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <Truck className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">REQ-{bid.requestId}</p>
                                  <p className="text-sm text-gray-600">Bid Amount: ${bid.amount}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(bid.status)}>
                                {bid.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Submitted {new Date(bid.createdAt!).toLocaleDateString()}</span>
                              </div>
                              {bid.status === 'accepted' && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">Loading bid history...</p>
                      )}
                    </div>
                    {Array.isArray(myBids) && myBids.length > 3 && (
                      <div className="mt-4 text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("dashboard")}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          View All Bids
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
