import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Bell, User, LogOut, ClipboardList, Users, Clock, CheckCircle, Download, UserPlus, RefreshCw, MapPin, BarChart, TrendingUp, DollarSign, Activity, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type TransportRequest, type Bid, registerUserSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { TrackingMap } from "@/components/tracking-map";
import BidModal from "@/components/bid-modal";

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

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("requests");
  const [selectedTrackingRequest, setSelectedTrackingRequest] = useState<TransportRequest | null>(null);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<any>(null);
  const [selectedReassignRequest, setSelectedReassignRequest] = useState<TransportRequest | null>(null);
  
  // User registration form
  const registerForm = useForm({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "client",
    },
  });

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

  // Register user mutation
  const registerUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User registered successfully",
      });
      registerForm.reset();
      // Refresh stats to show updated counts
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
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
        description: "Failed to register user",
        variant: "destructive",
      });
    },
  });

  const onRegisterSubmit = (data: any) => {
    registerUserMutation.mutate(data);
  };

  // Re-assignment mutation
  const reassignRequestMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: number }) => {
      const response = await apiRequest("PATCH", `/api/transport-requests/${requestId}/reassign`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request has been reassigned and reopened for bidding",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedReassignRequest(null);
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
        description: "Failed to reassign request",
        variant: "destructive",
      });
    },
  });

  // Fetch driver details mutation
  const fetchDriverDetailsMutation = useMutation({
    mutationFn: async (driverId: number) => {
      const response = await apiRequest("GET", `/api/drivers/${driverId}`);
      return response.json();
    },
    onSuccess: (driverData) => {
      setSelectedDriverDetails(driverData);
    },
    onError: (error) => {
      console.error("Error fetching driver details:", error);
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/transport-requests/${requestId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedTrackingRequest(null);
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
        description: "Failed to update request status",
        variant: "destructive",
      });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
    retry: false,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/transport-requests"],
    enabled: !!user,
    retry: false,
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ requestId, driverId }: { requestId: number; driverId: string }) => {
      const response = await apiRequest("PATCH", `/api/transport-requests/${requestId}/assign`, { driverId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transport-requests"] });
      setSelectedRequestId(null);
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
        description: "Failed to assign driver",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = Array.isArray(requests) ? requests.filter((request: TransportRequest) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  }) : [];

  if (isLoading || statsLoading || requestsLoading) {
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
                <Badge className="bg-purple-100 text-purple-800">Admin Portal</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium">{(user as any)?.firstName} {(user as any)?.lastName}</span>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Request Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              User Registration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.totalRequests || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClipboardList className="text-blue-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.activeDrivers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="text-green-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.pendingApproval || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="text-yellow-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.completedToday || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Requests Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Request Management</CardTitle>
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests?.map((request: TransportRequest) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">REQ-{request.id}</TableCell>
                        <TableCell>{request.pickupLocation} → {request.deliveryLocation}</TableCell>
                        <TableCell>R{request.budget}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {request.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequestId(request.id)}
                              >
                                View Bids
                              </Button>
                            )}
                            {(request.status === "assigned" || request.status === "in_progress") && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTrackingRequest(request);
                                    if (request.assignedDriverId) {
                                      fetchDriverDetailsMutation.mutate(request.assignedDriverId);
                                    }
                                  }}
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  GPS Track
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedReassignRequest(request)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Reassign
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          </Card>
          </TabsContent>

          {/* Analytics Dashboard Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Revenue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700">Total Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-green-800">R 45,280</p>
                        <p className="text-sm text-green-600">+12% from last month</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700">Avg Deal Value</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">R 2,840</p>
                        <p className="text-sm text-blue-600">+5% from last month</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Revenue by Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Completed Jobs</span>
                          <span className="font-medium">R 32,150</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">In Progress</span>
                          <span className="font-medium">R 13,130</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Driver Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-700">Top Performer</span>
                        </div>
                        <p className="text-lg font-bold text-purple-800">Thato Rasebotsa</p>
                        <p className="text-sm text-purple-600">★ 4.9 Rating</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-orange-700">Completion Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-800">94.5%</p>
                        <p className="text-sm text-orange-600">Above average</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Driver Leaderboard</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                            <span className="text-sm">Thato Rasebotsa</span>
                          </div>
                          <span className="text-sm font-medium">15 jobs</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <span className="text-sm">Driver User</span>
                          </div>
                          <span className="text-sm font-medium">12 jobs</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                            <span className="text-sm">John Mathe</span>
                          </div>
                          <span className="text-sm font-medium">9 jobs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Request Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-800">{(stats as any)?.totalRequests || 0}</div>
                        <div className="text-sm text-blue-600">Total Requests</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-800">{Math.floor(((stats as any)?.totalRequests - (stats as any)?.pendingApproval) / (stats as any)?.totalRequests * 100) || 0}%</div>
                        <div className="text-sm text-green-600">Success Rate</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Status Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span className="text-sm">Pending</span>
                          </div>
                          <span className="text-sm font-medium">{(stats as any)?.pendingApproval || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="text-sm">Assigned</span>
                          </div>
                          <span className="text-sm font-medium">{filteredRequests.filter((r: TransportRequest) => r.status === "assigned").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                            <span className="text-sm">In Progress</span>
                          </div>
                          <span className="text-sm font-medium">{filteredRequests.filter((r: TransportRequest) => r.status === "in_progress").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-sm">Completed</span>
                          </div>
                          <span className="text-sm font-medium">{filteredRequests.filter((r: TransportRequest) => r.status === "completed").length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Geographic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Popular Routes</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Johannesburg → Cape Town</span>
                          <span className="text-sm font-medium">8 requests</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Durban → Pretoria</span>
                          <span className="text-sm font-medium">6 requests</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Cape Town → Port Elizabeth</span>
                          <span className="text-sm font-medium">4 requests</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="text-xl font-bold text-indigo-800">1,247 km</div>
                        <div className="text-sm text-indigo-600">Avg Distance</div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <div className="text-xl font-bold text-pink-800">R 2.85/km</div>
                        <div className="text-sm text-pink-600">Avg Rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time-based Analytics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Time-Based Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Peak Hours</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">8:00 - 10:00</span>
                          <span className="text-sm font-medium">32 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">14:00 - 16:00</span>
                          <span className="text-sm font-medium">28 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">10:00 - 12:00</span>
                          <span className="text-sm font-medium">24 requests</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Weekly Trends</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Monday</span>
                          <span className="text-sm font-medium">18 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tuesday</span>
                          <span className="text-sm font-medium">22 requests</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Wednesday</span>
                          <span className="text-sm font-medium">25 requests</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Response Times</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avg Response</span>
                          <span className="text-sm font-medium">2.3 hours</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Fastest</span>
                          <span className="text-sm font-medium">15 minutes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Completion Rate</span>
                          <span className="text-sm font-medium">94.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">98.7%</div>
                      <div className="text-sm text-blue-600">System Uptime</div>
                      <div className="text-xs text-blue-500 mt-1">Last 30 days</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">1.2s</div>
                      <div className="text-sm text-green-600">Avg Load Time</div>
                      <div className="text-xs text-green-500 mt-1">Page response</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-800">847</div>
                      <div className="text-sm text-purple-600">Active Users</div>
                      <div className="text-xs text-purple-500 mt-1">Last 7 days</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-800">4.8</div>
                      <div className="text-sm text-orange-600">User Rating</div>
                      <div className="text-xs text-orange-500 mt-1">Platform average</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            {/* User Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Register New User
                </CardTitle>
                <p className="text-gray-600">Create new accounts for clients, drivers, and administrators.</p>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="At least 6 characters" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="driver">Driver</SelectItem>
                              {(user as any)?.role === "admin" && (
                                <SelectItem value="admin">Administrator</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={registerUserMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {registerUserMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedRequestId && (
        <BidModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onSelectDriver={(driverId) => assignDriverMutation.mutate({ requestId: selectedRequestId, driverId })}
        />
      )}

      {/* Request Tracking Modal */}
      {selectedTrackingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Track Request REQ-{selectedTrackingRequest.id}</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setSelectedTrackingRequest(null);
                setSelectedDriverDetails(null);
              }}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <Badge className={getStatusColor(selectedTrackingRequest.status)}>
                  {selectedTrackingRequest.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-medium">{selectedTrackingRequest.pickupLocation} → {selectedTrackingRequest.deliveryLocation}</p>
              </div>
              {selectedTrackingRequest.assignedDriverId && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Assigned Driver</p>
                    {selectedDriverDetails ? (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedDriverDetails.firstName} {selectedDriverDetails.lastName}
                            </p>
                            <p className="text-sm text-gray-600">Driver ID: #{selectedDriverDetails.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              ★ {selectedDriverDetails.rating || '4.5'}/5
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedDriverDetails.completedJobs || 24} jobs completed
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium">{selectedDriverDetails.phoneNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium text-xs">{selectedDriverDetails.email}</p>
                          </div>
                        </div>
                        
                        {selectedDriverDetails.vehicleType && (
                          <div className="border-t pt-2">
                            <p className="text-sm text-gray-600">Vehicle Details</p>
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium">
                                {selectedDriverDetails.vehicleType} ({selectedDriverDetails.vehicleModel || 'N/A'})
                              </p>
                              <p className="text-sm text-gray-600">
                                Capacity: {selectedDriverDetails.vehicleCapacity || 'N/A'}
                              </p>
                            </div>
                            {selectedDriverDetails.licensePlate && (
                              <p className="text-xs text-gray-600">
                                Plate: {selectedDriverDetails.licensePlate}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          <p className="text-sm text-gray-600">Loading driver details...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTrackingRequest.status === "assigned" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ requestId: selectedTrackingRequest.id, status: "in_progress" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Start Journey
                    </Button>
                  )}
                  {selectedTrackingRequest.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ requestId: selectedTrackingRequest.id, status: "completed" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ requestId: selectedTrackingRequest.id, status: "cancelled" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    Cancel Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Reassignment Modal */}
      {selectedReassignRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reassign Request REQ-{selectedReassignRequest.id}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReassignRequest(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-medium">{selectedReassignRequest.pickupLocation} → {selectedReassignRequest.deliveryLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Currently Assigned To</p>
                <p className="font-medium">Driver #{selectedReassignRequest.assignedDriverId}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Reassigning will remove the current driver assignment and reopen the request for new bids. The assigned driver will be notified.
                </p>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => reassignRequestMutation.mutate({ requestId: selectedReassignRequest.id })}
                  disabled={reassignRequestMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {reassignRequestMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReassignRequest(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
