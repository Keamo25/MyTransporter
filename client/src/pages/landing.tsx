import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Users, Shield, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full mb-3 sm:mb-4">
                  <Truck className="text-white text-xl sm:text-2xl" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">MyTransporter</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">We transport at your financial convenience</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <Users className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Sign In
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/register'}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <Truck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Get Started
                </Button>
              </div>
              
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-600" />
                  <span>For clients and drivers</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-purple-600" />
                  <span>Admin portal available</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600" />
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
