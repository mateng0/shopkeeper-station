
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";
import { 
  Eye, 
  Trash2, 
  ArrowLeft,
  Search,
  ShoppingBag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  user_id: string;
  photos?: ProductPhoto[];
}

interface ProductPhoto {
  id: string;
  photo_url: string;
  product_id: string;
}

const AdminPage = () => {
  useRequireAuth();
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.email?.includes("admin")) {
      navigate('/');
      toast.error("You don't have access to the admin panel");
    }
  }, [user, navigate]);

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
        toast.error(error.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.email?.includes("admin")) {
      fetchProducts();
    }
  }, [user, navigate]);

  const handleDelete = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this product?")) return;
      
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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const viewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-xl">Mateng Marketplace - Admin</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Product Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-500">No products found</h3>
                {searchTerm && (
                  <p className="mt-2 text-gray-400">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category || "N/A"}</TableCell>
                        <TableCell>₹{product.mrp?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>₹{product.discount?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>{formatDate(product.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => viewProduct(product)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Mateng Marketplace owned by Justmateng Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  {selectedProduct.description}
                </DialogDescription>
              </DialogHeader>
              
              {selectedProduct.photos && selectedProduct.photos.length > 0 && (
                <div className="flex gap-4 overflow-x-auto py-2">
                  {selectedProduct.photos.map((photo, index) => (
                    <img 
                      key={index}
                      src={photo.photo_url} 
                      alt={`${selectedProduct.name} photo ${index + 1}`} 
                      className="h-40 w-auto object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold">Category:</h4>
                  <p>{selectedProduct.category || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">SKU:</h4>
                  <p>{selectedProduct.sku || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Price:</h4>
                  <p>₹{selectedProduct.mrp?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Discount:</h4>
                  <p>₹{selectedProduct.discount?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Expiry Date:</h4>
                  <p>{formatDate(selectedProduct.expiry)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Manufacturer:</h4>
                  <p>{selectedProduct.manufactured_by || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Quantity/Size:</h4>
                  <p>{selectedProduct.quantity || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Created At:</h4>
                  <p>{formatDate(selectedProduct.created_at)}</p>
                </div>
              </div>
              
              {selectedProduct.return_policy && (
                <div className="mt-4">
                  <h4 className="font-semibold">Return Policy:</h4>
                  <p>{selectedProduct.return_policy}</p>
                </div>
              )}
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(selectedProduct.id);
                    setIsViewDialogOpen(false);
                  }}
                >
                  Delete Product
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
