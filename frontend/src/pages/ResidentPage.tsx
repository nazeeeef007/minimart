import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog';




const ResidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [voucherBalance, setVoucherBalance] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]); // State to store product list
  const [cart, setCart] = useState<any[]>([]); // State to store items in the cart
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // For modal popup visibility
  const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState<boolean>(false); // For insufficient voucher modal
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [approvedTransactions, setApprovedTransactions] = useState<any[]>([]);
  const [viewApproved, setViewApproved] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false); // State for reset modal
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>(''); // New state for the current password

  // Fetch voucher balance from the backend
  useEffect(() => {
    const fetchVoucherBalance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get('http://localhost:5000/api/resident/vouchers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setVoucherBalance(response.data.voucherBalance);
      } catch (error) {
        setError('Failed to fetch voucher balance. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoucherBalance();
  }, []);

  // Fetch products from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get('http://localhost:5000/api/resident/product', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setProducts(response.data.products); // Update state with products
      } catch (error) {
        setError('Failed to fetch products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/resident/transactions', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        });
  
        setPendingTransactions(response.data.pendingTransactions);
        setApprovedTransactions(response.data.approvedTransactions);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      }
    };
  
    fetchTransactionHistory();
  }, []);

  

  // Handle adding products to the cart
  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      const productIndex = updatedCart.findIndex(item => item._id === product._id);

      if (productIndex !== -1) {
        // Update the quantity if the product already exists in the cart
        updatedCart[productIndex].quantity += 1;
      } else {
        // Add new product to the cart with quantity 1
        updatedCart.push({ ...product, quantity: 1 });
      }

      return updatedCart;
    });
  };

  // Handle opening and closing the modal
  const toggleModal = () => {
    setIsModalOpen((prevState) => !prevState);
  };
  const toggleResetModal = () => {
    setIsResetModalOpen((prevState) => !prevState);
  };


  // Handle submitting the cart to the backend
  const submitCart = async () => {
    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    if (voucherBalance && voucherBalance < totalPrice) {
      setIsInsufficientModalOpen(true); // Show insufficient voucher modal
      return;
    }

    try {
      const formattedCart = cart.map(item => ({
        productId: item._id, // Send only productId, backend will populate details
        quantity: item.quantity,
        price: item.price,  // Ensure the price is included
        name: item.name,       // Send the name directly if available
      }));
  
      const response = await axios.post('http://localhost:5000/api/resident/checkout', 
        { items: formattedCart }, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
  
      console.log(response.data);
      console.log("ok")
      toggleModal();
    } catch (error: any) {
      console.error('Error submitting cart:', error.response?.data || error.message);
    }
  };

  // Handle password reset logic
const handlePasswordReset = async () => {
  if (newPassword !== confirmPassword) {
    setResetError('Passwords do not match');
    return;
  }

  if (!currentPassword) {
    setResetError('Current password is required');
    return;
  }
  console.log(currentPassword); 
  console.log(newPassword); 
  try {
    await axios.post('http://localhost:5000/api/resident/reset-password', 
      {  oldPassword: currentPassword, newPassword }, // Send both current and new passwords
      
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    setResetError(null); // Reset any error
    setIsResetModalOpen(false); // Close the modal after successful reset
    alert('Password has been reset successfully');
    // After successful password reset
    localStorage.removeItem('token');  // Remove the JWT from localStorage

    // Optionally, redirect the user to the login page
    window.location.href = 'http://localhost:5173'
  } catch (error) {
    setResetError('Failed to reset password. Please try again later.');
  }
};

  return (
    <div className="p-6 space-y-8">
      {/* Voucher Balance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-blue-500 text-white">
            <h3 className="text-lg">Voucher Balance</h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-2xl font-bold">{voucherBalance} Vouchers</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" color="blue" onClick={() => navigate('/voucher-history')}>
              View History
            </Button>
          </CardFooter>
        </Card>
      </div>
      

      {/* Add Reset Password Button */}
<div className="flex justify-center">
  <Button variant="outline" color="red" onClick={toggleResetModal}>
    Reset Password
  </Button>
</div>

{isResetModalOpen && (
  <Dialog open={isResetModalOpen}>
    <DialogOverlay className="fixed inset-0 bg-transparent" />
    <DialogContent className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-xs">
      {/* Adding DialogTitle for accessibility */}
      <DialogTitle className="text-xl font-semibold mb-4">Reset Your Password</DialogTitle>
      
      {resetError && <p className="text-red-600 text-sm mb-4">{resetError}</p>}
      
      <div className="space-y-4">
        {/* Input for Current Password */}
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        
        {/* Input for New Password */}
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        
        {/* Input for Confirm Password */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          color="gray"
          onClick={toggleResetModal}
          className="mr-4"
        >
          Cancel
        </Button>
        
        <Button
          variant="default"
          color="blue"
          onClick={handlePasswordReset}
        >
          Reset Password
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}

      <div className="flex justify-center space-x-4">
        {/* Pending Transactions Button */}
        <Button
          variant="outline"
          color="blue"
          onClick={() => setViewApproved(false)}
          className="text-blue-600 border-blue-600 hover:bg-blue-100"
        >
          View Pending Transactions
        </Button>

        {/* Approved Transactions Button */}
        <Button
          variant="outline"
          color="green"
          onClick={() => setViewApproved(true)}
          className="text-green-600 border-green-600 hover:bg-green-100"
        >
          View Approved Transactions
        </Button>
      </div>


      <div className="mt-6">
        {viewApproved ? (
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Approved Transactions</h3>
            <ul className="space-y-4">
              {(approvedTransactions || []).map((transaction) => (
                <li key={transaction._id} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                  <span className="text-gray-700">{transaction.itemName} (x{transaction.quantity})</span>
                  <span className="text-gray-800 font-semibold">${transaction.totalPrice}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Pending Transactions</h3>
            <ul className="space-y-4">
              {(pendingTransactions || []).map((transaction) => (
                <li key={transaction._id} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                  <span className="text-gray-700">{transaction.itemName} (x{transaction.quantity})</span>
                  <span className="text-gray-800 font-semibold">${transaction.totalPrice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading products...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          products.map((product) => (
            <Card key={product._id}>
              <CardHeader className="bg-green-500 text-white">
                <h3 className="text-lg">{product.name}</h3>
              </CardHeader>
              <CardContent>
                {product.imageUrl && <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} className="w-full h-64 object-cover" />}
                <p className="text-lg mt-2">{product.description}</p>
                <p className="text-2xl font-bold mt-2">${product.price}</p>
                <p className="text-sm text-gray-500">Category: {product.category}</p>
                <p className="text-sm text-gray-500">Stock: {product.quantity} available</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline" color="green" onClick={() => addToCart(product)}>
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Cart Button */}
      <div className="flex justify-center">
        <Button variant="default" color="blue" onClick={toggleModal} disabled={cart.length === 0}>
          View Cart ({cart.length})
        </Button>
      </div>

      {/* Modal Popup for Cart */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Your Cart</h2>
            <ul className="space-y-4">
              {cart.map((item) => (
                <li key={item._id} className="flex justify-between items-center">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>${item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" color="gray" onClick={toggleModal}>
                Close
              </Button>
              <Button variant="default" color="green" onClick={submitCart}>
                Submit Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Insufficient Voucher Balance */}
      {isInsufficientModalOpen && (
        <Dialog open={isInsufficientModalOpen}>
          <DialogOverlay className="fixed inset-0 bg-transparent" />
            <DialogContent 
              
              style={{ transform: 'translate(-155px, -100px)', width: 'auto', height: 'auto' }}
            >
            <div className="bg-white p-6 rounded-lg shadow-lg w-64 max-w-xs">
              <h2 className="text-xl font-semibold text-red-600">Insufficient Voucher Balance</h2>
              <p className="mt-2 text-gray-700">You do not have enough balance to complete the checkout.</p>
              <div className="mt-4 flex justify-end">
                <DialogClose
                  onClick={() => setIsInsufficientModalOpen(false)} // Close the dialog by controlling state
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Close
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}


      



    </div>
  );
};

export default ResidentPage;
