import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Truck, Bell, User, LogOut, MapPin, Calendar, Package, Star, Mail, Phone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { clientTransportRequestSchema, type TransportRequest } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { TrackingMap } from "@/components/tracking-map";

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "assigned": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-purple-100 text-purple-800";
    case "completed": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function ClientDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("requests");

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

  const form = useForm({
    resolver: zodResolver(clientTransportRequestSchema),
    defaultValues: {
      pickupLocation: "",
      deliveryLocation: "",
      pickupDate: "",
      pickupTime: "",
      deliveryDate: "",
      deliveryTime: "",
      itemDescription: "",
      weight: "",
      dimensions: "",
      budget: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transport-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transport request created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/transport-requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create transport request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createRequestMutation.mutate({
      ...data,
      weight: parseFloat(data.weight),
      budget: parseFloat(data.budget),
    });
  };

  if (isLoading || requestsLoading) {
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
                <Badge className="bg-blue-100 text-blue-800">Client Portal</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
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
            <TabsTrigger value="requests">Transport Requests</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Request Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Create New Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="pickupLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter pickup address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter delivery address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="pickupDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pickup Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pickupTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pickup Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="deliveryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="itemDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the items to be transported" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dimensions (LxWxH)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2x1x1 meters" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (R)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={createRequestMutation.isPending}>
                        {createRequestMutation.isPending ? "Creating..." : "Create Request"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Requests */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(requests) && requests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No requests yet</p>
                  ) : Array.isArray(requests) ? (
                    requests.map((request: TransportRequest) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">REQ-{request.id}</span>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {request.pickupLocation} → {request.deliveryLocation}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Created {new Date(request.createdAt!).toLocaleDateString()}
                        </p>
                        
                        {/* Show tracking for assigned/in-progress requests */}
                        {(request.status === 'assigned' || request.status === 'in_progress') && (
                          <div className="mt-4">
                            <TrackingMap
                              requestId={request.id}
                              pickupLocation={request.pickupLocation}
                              deliveryLocation={request.deliveryLocation}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">Loading requests...</p>
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
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                      <User className="text-white text-3xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-gray-600">Client Account</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600">Client since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <Input value={user?.email || ''} disabled className="bg-gray-100" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <Input placeholder="+27 (xxx) xxx-xxxx" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <Input defaultValue={user?.firstName || ''} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <Input defaultValue={user?.lastName || ''} />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-700">Update Profile</Button>
                    </div>
                  </div>

                  {/* Request History Summary */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4">Request Activity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Total Requests</p>
                        <p className="text-2xl font-bold text-blue-900">{Array.isArray(requests) ? requests.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Array.isArray(requests) ? requests.filter(r => r.status === 'completed').length : 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {Array.isArray(requests) ? requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Requests in Profile */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent Transport Requests</h4>
                    <div className="space-y-4">
                      {Array.isArray(requests) && requests.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No transport requests yet</p>
                          <p className="text-sm text-gray-400">Start by creating your first request in the Transport Requests tab</p>
                        </div>
                      ) : Array.isArray(requests) ? (
                        requests.slice(0, 3).map((request: TransportRequest) => (
                          <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <MapPin className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">REQ-{request.id}</p>
                                  <p className="text-sm text-gray-600">
                                    {request.pickupLocation} → {request.deliveryLocation}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Created {new Date(request.createdAt!).toLocaleDateString()}</span>
                              </div>
                              <span className="font-medium text-green-600">R{request.budget}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">Loading requests...</p>
                      )}
                    </div>
                    {Array.isArray(requests) && requests.length > 3 && (
                      <div className="mt-4 text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("requests")}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          View All Requests
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
