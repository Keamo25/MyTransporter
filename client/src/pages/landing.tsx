import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Users, Shield, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700">
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-4">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                  <Truck className="text-white text-2xl" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">LogiFlow</h1>
                <p className="text-gray-600 mt-2">Logistics Management Platform</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/register'}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="h-4 w-4 mr-2 text-blue-600" />
                  <span>For clients and drivers</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2 text-purple-600" />
                  <span>Admin portal available</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-green-600" />
                  <span>Real-time bid management</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
