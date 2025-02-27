
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/useRequireAuth";
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
}

const DashboardPage = () => {
  useRequireAuth();
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        setProducts(data || []);
      } catch (error: any) {
        toast.error(error.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setProducts(products.filter(product => product.id !== id));
      toast.success("Product deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Error deleting product");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
          <Button onClick={() => navigate("/products/new")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-500 mb-4">No products found</h3>
          <Button onClick={() => navigate("/products/new")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="font-medium">Category:</span> {product.category || "N/A"}</p>
                <p><span className="font-medium">SKU:</span> {product.sku || "N/A"}</p>
                <p><span className="font-medium">Price:</span> ₹{product.mrp?.toFixed(2) || "0.00"}</p>
                {product.discount && (
                  <p><span className="font-medium">Discount:</span> ₹{product.discount.toFixed(2)}</p>
                )}
                <p><span className="font-medium">Expiry:</span> {formatDate(product.expiry)}</p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/products/edit/${product.id}`)}>
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this product?")) {
                      handleDelete(product.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
