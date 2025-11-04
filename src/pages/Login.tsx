import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Login = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login Successful!",
      description: "Welcome back to Muzicalist.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Login to your Muzicalist account
            </p>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur border-accent/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2 bg-background/50"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-2 bg-background/50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-accent/30" />
                  Remember me
                </label>
                <a href="#" className="text-accent hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
                Login
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-accent hover:underline font-semibold">
                Register here
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
