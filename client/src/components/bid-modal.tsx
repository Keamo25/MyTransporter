import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Star } from "lucide-react";
import { type TransportRequest, type Bid } from "@shared/schema";

interface BidModalProps {
  requestId: number;
  onClose: () => void;
  onSelectDriver: (driverId: string) => void;
}

export default function BidModal({ requestId, onClose, onSelectDriver }: BidModalProps) {
  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ["/api/transport-requests", requestId],
    retry: false,
  });

  const { data: bids, isLoading: bidsLoading } = useQuery({
    queryKey: ["/api/bids/request", requestId],
    retry: false,
  });

  if (requestLoading || bidsLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Bids for Request REQ-{requestId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Request Details */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Request Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="font-medium">{request?.pickupLocation} → {request?.deliveryLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client Budget</p>
                  <p className="font-medium text-green-600">${request?.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pickup Date</p>
                  <p className="font-medium">
                    {request?.pickupDate ? new Date(request.pickupDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-medium">{request?.weight} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bids List */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Driver Bids</h4>
            
            {bids?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bids received yet</p>
            ) : (
              bids?.map((bid: Bid) => (
                <Card key={bid.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <User className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Driver {bid.driverId}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              <span>4.5/5 rating</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Bid Amount</p>
                            <p className="text-lg font-bold text-green-600">${bid.amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Estimated Delivery</p>
                            <p className="font-medium">
                              {new Date(bid.estimatedDelivery).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={`${bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                              {bid.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {bid.message && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">Message</p>
                            <p className="text-gray-900">{bid.message}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        <Button
                          onClick={() => onSelectDriver(bid.driverId)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          Select Driver
                        </Button>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
