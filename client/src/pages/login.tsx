import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Truck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loginUserSchema } from "@shared/schema";
import { useLocation } from "wouter";

export default function Login() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const form = useForm({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full mb-3 sm:mb-4 mx-auto">
                <Truck className="text-white text-xl sm:text-2xl" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">Sign In</CardTitle>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Welcome back to MyTransporter</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">We transport at your financial convenience</p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={() => navigate("/register")}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}