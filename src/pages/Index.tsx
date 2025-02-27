
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ListPlus, BarChart3, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sku: string | null;
  mrp: number | null;
  discount: number | null;
  expiry: string | null;
  manufactured_by: string | null;
  quantity: string | null;
  return_policy: string | null;
  created_at: string;
  photos?: ProductPhoto[];
}

interface ProductPhoto {
  id: string;
  photo_url: string;
  product_id: string;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (productsError) throw productsError;
        
        // Fetch all photos for all products
        const { data: photosData, error: photosError } = await supabase
          .from("product_photos")
          .select("*");

        if (photosError) throw photosError;
        
        // Group photos by product_id
        const photosByProduct: Record<string, ProductPhoto[]> = {};
        photosData.forEach((photo) => {
          if (photo.product_id) {
            if (!photosByProduct[photo.product_id]) {
              photosByProduct[photo.product_id] = [];
            }
            photosByProduct[photo.product_id].push(photo);
          }
        });
        
        // Combine products with their photos
        const productsWithPhotos = productsData.map((product) => ({
          ...product,
          photos: photosByProduct[product.id] || []
        }));
        
        setProducts(productsWithPhotos);
      } catch (error: any) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const handleBuy = (product: Product) => {
    // For now, just show a toast that the product is bought
    // In a real app, this would redirect to a checkout page
    toast.success(`You've ordered ${product.name}! This is a demo - no actual purchase was made.`);
  };

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
        <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
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

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Featured Products</h2>
            <p className="text-center text-muted-foreground mb-10">Browse all available products from our vendors</p>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-500">No products available yet</h3>
                <p className="mt-2 text-gray-400">Check back later or register as a vendor to add products</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden flex flex-col h-full">
                    {product.photos && product.photos.length > 0 ? (
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={product.photos[0].photo_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl line-clamp-1">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{product.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 flex-grow">
                      {product.category && (
                        <div className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium mb-2">
                          {product.category}
                        </div>
                      )}
                      <p><span className="font-medium">Price:</span> ₹{product.mrp?.toFixed(2) || "0.00"}</p>
                      {product.discount && product.discount > 0 && (
                        <p className="text-green-600"><span className="font-medium">Discount:</span> ₹{product.discount.toFixed(2)}</p>
                      )}
                      {product.manufactured_by && (
                        <p><span className="font-medium">Brand:</span> {product.manufactured_by}</p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 border-t">
                      <Button 
                        onClick={() => handleBuy(product)} 
                        className="w-full"
                      >
                        Buy Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-gray-50">
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
