
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";

interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  mrp: string;
  discount: string;
  expiry: string;
  manufactured_by: string;
  quantity: string;
  return_policy: string;
}

interface ProductPhoto {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

const ProductFormPage = () => {
  const { user } = useRequireAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [product, setProduct] = useState<Product>({
    name: "",
    description: "",
    category: "",
    sku: "",
    mrp: "",
    discount: "",
    expiry: "",
    manufactured_by: "",
    quantity: "",
    return_policy: "",
  });

  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchProduct = async () => {
        try {
          // Fetch the product
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .single();

          if (productError) throw productError;
          
          // Format the date for the input field (yyyy-MM-dd)
          const formattedProduct = {
            ...productData,
            mrp: productData.mrp?.toString() || "",
            discount: productData.discount?.toString() || "",
            expiry: productData.expiry ? productData.expiry.split("T")[0] : "",
          };

          setProduct(formattedProduct);
          
          // Fetch product photos
          const { data: photoData, error: photoError } = await supabase
            .from("product_photos")
            .select("*")
            .eq("product_id", id);

          if (photoError) throw photoError;
          
          const formattedPhotos = photoData.map(photo => ({
            id: photo.id,
            url: photo.photo_url,
            isNew: false
          }));
          
          setPhotos(formattedPhotos);
        } catch (error: any) {
          toast.error(error.message || "Error fetching product");
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: ProductPhoto[] = [];
      
      Array.from(e.target.files).forEach(file => {
        // Only accept images
        if (!file.type.startsWith("image/")) {
          toast.error(`File ${file.name} is not an image`);
          return;
        }
        
        // Create a temporary URL for preview
        const url = URL.createObjectURL(file);
        newPhotos.push({
          url,
          file,
          isNew: true
        });
      });
      
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    
    // If it's a temporary URL, revoke it to prevent memory leaks
    const photo = newPhotos[index];
    if (photo.isNew && photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
    
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const productData = {
        ...product,
        user_id: user.id,
        mrp: product.mrp ? parseFloat(product.mrp) : null,
        discount: product.discount ? parseFloat(product.discount) : null,
      };
      
      let productId = id;
      
      // Insert or update the product
      if (isEditMode) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();
          
        if (error) throw error;
        productId = data.id;
      }
      
      // Handle photo uploads and updates
      if (productId) {
        // Handle new photo uploads
        const newPhotos = photos.filter(photo => photo.isNew && photo.file);
        
        for (const photo of newPhotos) {
          if (photo.file) {
            const fileExt = photo.file.name.split('.').pop();
            const filePath = `${productId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('product_photos')
              .upload(filePath, photo.file);
              
            if (uploadError) throw uploadError;
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from('product_photos')
              .getPublicUrl(filePath);
              
            // Save to product_photos table
            const { error: insertError } = await supabase
              .from('product_photos')
              .insert({
                product_id: productId,
                photo_url: publicUrlData.publicUrl
              });
              
            if (insertError) throw insertError;
          }
        }
        
        // Delete removed photos (for edit mode)
        if (isEditMode) {
          const currentPhotoIds = photos
            .filter(photo => !photo.isNew && photo.id)
            .map(photo => photo.id);
            
          const { error: deleteError } = await supabase
            .from('product_photos')
            .delete()
            .eq('product_id', productId)
            .not('id', 'in', currentPhotoIds.length > 0 ? `(${currentPhotoIds.join(',')})` : '(-1)');
            
          if (deleteError) throw deleteError;
        }
      }
      
      toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || `Error ${isEditMode ? 'updating' : 'creating'} product`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? "Edit" : "Add"} Product</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  placeholder="e.g. Electronics, Clothing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={handleChange}
                  placeholder="Stock Keeping Unit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufactured_by">Manufactured By</Label>
                <Input
                  id="manufactured_by"
                  name="manufactured_by"
                  value={product.manufactured_by}
                  onChange={handleChange}
                  placeholder="Manufacturer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (₹)</Label>
                <Input
                  id="mrp"
                  name="mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.mrp}
                  onChange={handleChange}
                  placeholder="Maximum Retail Price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.discount}
                  onChange={handleChange}
                  placeholder="Discount amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  type="date"
                  value={product.expiry}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity/Size</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  value={product.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 100ml, XL, 500g"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                placeholder="Detailed description of your product"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return_policy">Return Policy</Label>
              <Textarea
                id="return_policy"
                name="return_policy"
                value={product.return_policy}
                onChange={handleChange}
                placeholder="Return policy details"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-4">
              <Label>Product Photos</Label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo.url} 
                      alt={`Product photo ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-md border" 
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                <label className="border-2 border-dashed rounded-md flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 
                `${isEditMode ? 'Updating' : 'Saving'}...` : 
                `${isEditMode ? 'Update' : 'Save'} Product`
              }
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default ProductFormPage;
