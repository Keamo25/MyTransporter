import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Bell, User, LogOut, ClipboardList, Users, Clock, CheckCircle, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type TransportRequest, type Bid } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
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

  const filteredRequests = requests?.filter((request: TransportRequest) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalRequests || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeDrivers || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingApproval || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedToday || 0}</p>
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
                        <TableCell>${request.budget}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequestId(request.id)}
                            >
                              View Bids
                            </Button>
                          )}
                          {request.status === "assigned" && (
                            <Button variant="outline" size="sm">
                              Track
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bid Modal */}
      {selectedRequestId && (
        <BidModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onSelectDriver={(driverId) => assignDriverMutation.mutate({ requestId: selectedRequestId, driverId })}
        />
      )}
    </div>
  );
}
