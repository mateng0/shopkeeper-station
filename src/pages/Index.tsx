
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ListPlus, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-xl">Vendor Dashboard</span>
          </div>
          <Button 
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            variant="default"
          >
            {user ? 'Dashboard' : 'Login / Register'}
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Manage Your Products With Ease</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A simple yet powerful platform for vendors to add, edit, and track their product inventory
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="text-lg px-8"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ListPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Product Management</h3>
                <p className="text-muted-foreground">
                  Add, edit, and remove products with a comprehensive set of fields for complete product information.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
                <p className="text-muted-foreground">
                  Your product data is protected with secure authentication, ensuring only you can access your inventory.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Product Analytics</h3>
                <p className="text-muted-foreground">
                  Get insights into your product portfolio with detailed views and management tools.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Vendor Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
