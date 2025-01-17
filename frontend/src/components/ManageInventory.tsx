import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

const ManageInventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAuctionDialog, setShowAuctionDialog] = useState(false);
  const [auctionProductName, setAuctionProductName] = useState('');
  const [auctionEndTime, setAuctionEndTime] = useState('');
  const [auctionStartingBid, setAuctionStartingBid] = useState('');

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Fetch products based on search query
  const fetchProducts = async () => {
    if (searchQuery === '') {
      setProducts([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/searchProducts?name=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setProducts(response.data.products);
    } catch (err) {
      toast.error('Failed to fetch products');
    }
  };

  // Open dialog and set the selected product details
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setNewPrice(String(product.price));
    setNewQuantity(String(product.quantity));
    setNewName(product.name);
    setNewDescription(product.description);
    setNewCategory(product.category);
    setShowDialog(true);
  };

  // Handle product details update
  const handleUpdateProduct = async () => {
    if (!newPrice || !newQuantity || !newName || !newDescription || !newCategory) {
      toast.error('Please provide valid details for all fields.');
      return;
    }
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(
        `http://localhost:5000/api/admin/updateProduct/${selectedProduct?._id}`,
        {
          name: newName,
          description: newDescription,
          category: newCategory,
          price: Number(newPrice),
          quantity: Number(newQuantity),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Token for authentication
            adminId: adminId, // Admin ID to track who made the change
          },
        }
      );
      toast.success('Product updated successfully!');
      setShowDialog(false);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === selectedProduct?._id
            ? { ...p, name: newName, description: newDescription, category: newCategory, price: Number(newPrice), quantity: Number(newQuantity) }
            : p
        )
      );
    } catch (err) {
      toast.error('Failed to update product.');
    }
  };

  // Handle product delete
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.delete(`http://localhost:5000/api/admin/deleteProduct/${selectedProduct._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          adminId: adminId
        },
      });
      toast.success('Product deleted successfully!');
      setShowDeleteDialog(false);
      setProducts(prevProducts => prevProducts.filter(p => p._id !== selectedProduct._id));
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  // Handle auction creation
  const handleCreateAuction = async () => {
    if (!auctionProductName || !auctionEndTime || !auctionStartingBid) {
      toast.error('Please provide valid details for the auction.');
      return;
    }
    try {
      const formattedEndTime = new Date(auctionEndTime).toISOString();
      const adminId = localStorage.getItem('userId');
      console.log(formattedEndTime); // Check if the date is being correctly formatted
      const response = await axios.post(
        'http://localhost:5000/api/admin/createAuction',
        {
          productName: auctionProductName,
          auctionEndDate: formattedEndTime,
          startingBid: auctionStartingBid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            adminId: adminId
          },
        }
      );
      
      toast.success('Auction created successfully!');
      setAuctionProductName('');
      setAuctionEndTime('');
      setAuctionStartingBid('');
    } catch (err) {
      toast.error('Failed to create auction.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Manage Inventory</h1>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-lg">
          <Input
            type="text"
            placeholder="Search for a product by name"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="flex justify-between items-center bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 transition-all duration-300">
              <span className="text-lg font-medium text-gray-800">{product.name}</span>
              <div className="flex items-center space-x-4">
                <Button onClick={() => handleProductClick(product)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit
                </Button>
                <Button onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Delete
                </Button>
                <Button onClick={() => { setAuctionProductName(product.name); setShowAuctionDialog(true); }} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80">
                  Create Auction
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No products found.</p>
        )}
      </div>
       {/* Edit Product Dialog */}
       <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Name</label>
            <Input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Description</label>
            <Input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Category</label>
            <Input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Price</label>
            <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Quantity</label>
            <Input type="number" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Auction Create Dialog */}
      <Dialog open={showAuctionDialog} onOpenChange={setShowAuctionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Auction</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Product Name</label>
            <Input type="text" value={auctionProductName} onChange={(e) => setAuctionProductName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Auction End Time</label>
            <Input type="datetime-local" value={auctionEndTime} onChange={(e) => setAuctionEndTime(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Starting Bid</label>
            <Input type="number" value={auctionStartingBid} onChange={(e) => setAuctionStartingBid(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuctionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAuction}>Create Auction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this product?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageInventory;
