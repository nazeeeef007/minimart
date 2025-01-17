import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogOverlay, DialogClose,  DialogFooter , DialogTrigger, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { Input } from '@/components/ui/input';
import Auction from '@/components/Auction';
import useLogout from '@/components/Logout'; // Import the useLogout hook
import { ObjectId } from 'mongodb'; // Import ObjectId if using MongoDB


const ResidentPage: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const [username, setUsername] = useState<string | null>(null);
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false); // New state for notification modal
  const [isViewTransactionModalOpen, setIsViewTransactionModalOpen] = useState<boolean>(false); // For modal popup visibility
  
    // Additional state for the voucher request form
  const [voucherAmount, setVoucherAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitVoucherRequestModalOpen, setIsSubmitVoucherRequestModalOpen] = useState<boolean>(false); // For modal popup visibility
    // New state for voucher options
  const [voucherOptions, setVoucherOptions] = useState<any[]>([]);
  const [selectedVoucherOptionId, setSelectedVoucherOptionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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


  
  

  // Fetch notifications from the backend
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get('http://localhost:5000/api/resident/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setNotifications(response.data.notifications);
        const unreadNotifications = response.data.notifications.filter((notification: any) => !notification.isRead);
        setUnreadCount(unreadNotifications.length);
      } catch (error) {
        setError('Failed to fetch notifications. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const fetchVoucherOptions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/resident/getVoucherOptions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setVoucherOptions(response.data.data); // Assuming response contains an array of options
        console.log(response.data.data);
      } catch (error) {
        console.error('Failed to fetch voucher options:', error);
      }
    };
  
    fetchVoucherOptions();
  }, []);

  useEffect(() => {
    // Retrieve the username from localStorage
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername);
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

   // Handle search query change
   const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
    // Mark all notifications as read
  const handleReadNotifications = async () => {
      try {
        await axios.patch('http://localhost:5000/api/resident/markNotificationsAsRead', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
  
        // Update notifications as read in UI
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      } catch (error) {
        setError('Failed to mark notifications as read. Please try again later.');
      }
    };
  
  
   // Handle submission of voucher request
   const handleSubmitVoucherRequest = async () => {
    if (!selectedVoucherOptionId) {
      setSubmissionError('Please select a voucher option.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/resident/submitVoucherRequest',
        {
          voucherOptionId: selectedVoucherOptionId,
          requestedAmount: voucherAmount,
          reason,
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      toast.success("Voucher request submitted successfully!", {
        position: "top-center", // Top-center position
        autoClose: 5000, // Automatically closes after 5 seconds
        hideProgressBar: true, // Hides the progress bar
        closeOnClick: true, // Closes on click
        pauseOnHover: true, // Pauses on hover
      });
      if (response.status === 200) {
        
        setIsSubmitVoucherRequestModalOpen(false);
        setVoucherAmount(0);
        setReason('');
        setSelectedVoucherOptionId(null);
      }
    } catch (error) {
      setSubmissionError('Failed to submit voucher request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        price: item.price, // Ensure the price is included
        name: item.name,   // Send the name directly if available
      }));
      const username = localStorage.getItem('username');
      console.log(username);
      const response = await axios.post(
        'http://localhost:5000/api/resident/checkout',
        { items: formattedCart, username },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
  
      // If successful, empty the cart and close the modal
      setCart([]); // Reset cart to an empty array
      toast.success('Order submitted successfully!');
      toggleModal();
    } catch (error: any) {
      console.error('Error submitting cart:', error.response?.data || error.message);
      toast.error('Error submitting order.');
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


const SubmitVoucherButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>

)

const ResetPasswordButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>

)

const SubmitCartButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
</svg>


)

const ViewNotificationsButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
</svg>

)

const ViewPendingRequestsButton = () => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>


)

const ViewApprovedRequestsButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
</svg>

)

const LogoutButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
</svg>
)


  return (
    <div className="p-6 space-y-2">
        <h2 className="text-xl font-semibold mb-1 text-left">{username}'s Dashboard</h2>
        
      {/* Notification Bell Icon and Submit Voucher Button Container */}
      <div className="flex items-center space-x-2 justify-start">

        {/* Image positioned at the top right */}
        <img
          src="/muhammadiyah.png"// Replace with the actual image URL
          alt="Top Right Image"
          className="absolute top-0 right-10 h-36 w-48 " // Adjust size and position as needed
        />
        {/* Notification Bell Button */}
        <Button
          variant="ghost"
          onClick={() => setIsNotificationModalOpen(true)} // Open the notification modal
          aria-label="View Notifications"
          className="relative bg-blue-600 text-white hover:bg-blue-700 w-12 " // Ensure same width for consistency
          title="View Notifications"
          style={{ marginLeft: '1px' }}
        >
          {/* Bell Icon */}
          <ViewNotificationsButton />

          {/* Red Circle with Unread Count, if any */}
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
              {unreadCount}
            </div>
          )}
        </Button>

        {/* Submit Voucher Request Button */}
        <Button
          variant="outline"
          color="blue"
          onClick={() => setIsSubmitVoucherRequestModalOpen(true)}
          className="w-12 bg-blue-600 text-white hover:bg-blue-700" // Same width as the other button for uniformity
          title="Request Voucher"
        >
          <SubmitVoucherButton />
        </Button>

        <Button
          variant="outline"
          color="red"
          onClick={toggleResetModal}
          className="w-12 bg-blue-600 text-white hover:bg-blue-700"
          title="Reset Password"
        >
          <ResetPasswordButton />
        </Button>

        {/* Cart Button */}
        <Button
          variant="default"
          className="w-12 bg-blue-600 text-white hover:bg-blue-700"
          title="Submit Cart"
          onClick={toggleModal}
          disabled={cart.length === 0}
        >
          <SubmitCartButton /> ({cart.length})
        </Button>

        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white"
        title = "Log Out">
          <LogoutButton/>
        </Button>
      </div>

{/* Notification Modal */}
<Dialog open={isNotificationModalOpen} onOpenChange={(open) => setIsNotificationModalOpen(open)}>
  <DialogOverlay />
  <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
    <DialogTitle>Notifications</DialogTitle>
    <div className="space-y-6">
      {notifications.length === 0 ? (
        <p className="text-gray-600">No notifications available.</p>
      ) : (
        notifications
          .slice()
          .reverse() // Reverse the array to show the most recent first
          .map((notification) => (
            <div
              key={notification._id}
              className={`p-5 border-b-2 ${notification.isRead ? 'bg-gray-50' : 'bg-white'} shadow-sm rounded-lg`}
            >
              {/* Display main message */}
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{notification.message}</h3>

              {/* Display additional details if available */}
              {notification.description && (
                <p className="text-sm text-gray-600">{notification.description}</p>
              )}

              {/* Display order-related info if present */}
              {notification.orderId && (
                <div className="mt-4 border-t pt-2 border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Order ID:</strong> {notification.orderId}
                  </p>
                  {/* Ensure amount is a valid number before using toFixed */}
                  <p className="text-sm text-gray-700">
                    <strong>Amount:</strong> {typeof notification.amount === 'number' ? `$${notification.amount.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              )}

              {/* Display timestamp */}
              <div className="mt-3">
                <span className="text-xs text-gray-500">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))
      )}
    </div>

    {/* Button to mark all notifications as read */}
    <DialogClose asChild>
      <Button onClick={handleReadNotifications}>Mark All as Read</Button>
    </DialogClose>
  </DialogContent>
</Dialog>

{/* Modal for submitting voucher request */}
<Dialog open={isSubmitVoucherRequestModalOpen} onOpenChange={(open) => setIsSubmitVoucherRequestModalOpen(open)}>
  <DialogOverlay />
  <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
    <DialogTitle>Submit Voucher Request</DialogTitle>
    <div className="space-y-4">
      {/* Dropdown for selecting voucher option */}
      <div>
        <label htmlFor="voucherOption" className="block text-sm font-medium text-gray-700">
          Voucher Option
        </label>
        <select
          id="voucherOption"
          value={selectedVoucherOptionId || ''}
          onChange={(e) => setSelectedVoucherOptionId(e.target.value)}
          className="mt-2 p-2 border rounded w-full"
        >
          <option value="" disabled>Select a voucher option</option>
          {voucherOptions.map((option) => (
            <option key={option.id} value={option._id}>  {/* Use _id here */}
              {option.name}
            </option>
          ))}
        </select>
      </div>

      {/* Input for voucher amount */}
      <div>
        <label htmlFor="voucherAmount" className="block text-sm font-medium text-gray-700">
          Voucher Amount
        </label>
        <input
          type="number"
          id="voucherAmount"
          value={voucherAmount}
          onChange={(e) => setVoucherAmount(Number(e.target.value))}
          className="mt-2 p-2 border rounded w-full"
          placeholder="Enter voucher amount"
          min={1}
        />
      </div>

      {/* Textarea for reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason for Request
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 p-2 border rounded w-full"
          placeholder="Enter your reason"
        />
      </div>

      {/* Display error message if any */}
      {submissionError && (
        <div className="text-red-500 text-sm">{submissionError}</div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={handleSubmitVoucherRequest}
          disabled={isSubmitting}
          className="w-48" // Same width as the notification button
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </div>
    <DialogClose asChild>
      <Button variant="outline" color="gray" onClick={() => setIsSubmitVoucherRequestModalOpen(false)}>
        Close
      </Button>
    </DialogClose>
  </DialogContent>
</Dialog>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Voucher Balance Card */}
  <Card className="col-span-1 sm:col-span-2 lg:col-span-1 min-h-[300px] max-h-[300px]">
    <CardHeader className="bg-blue-500 text-black">
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

      {/* Transaction Buttons Section */}
      <div className="flex space-x-4 mt-6">
        {/* Pending Transactions Button */}
        <Button
          variant="outline"
          color="blue"
          onClick={() => {
            setViewApproved(false);
            setIsViewTransactionModalOpen(true); // Open modal on click
          }}
          className="text-blue-600 border-blue-600 hover:bg-blue-100 w-full sm:w-auto"
          title="View Pending Requests"
        >
          <ViewPendingRequestsButton />
        </Button>

        {/* Approved Transactions Button */}
        <Button
          variant="outline"
          color="green"
          onClick={() => {
            setViewApproved(true);
            setIsViewTransactionModalOpen(true); // Open modal on click
          }}
          className="text-green-600 border-green-600 hover:bg-green-100 w-full sm:w-auto"
          title="View Approved Requests"
        >
          <ViewApprovedRequestsButton />
        </Button>

        {/* Search Input */}
     <Input
        placeholder="Search products"
        value={searchQuery}
        onChange={handleSearchChange}
        className="mb-4 p-2 border border-gray-800 rounded w-2/5 placeholder-black"
      />
      </div>

      {/* Modal for Viewing Transactions */}
      <Dialog open={isViewTransactionModalOpen} onOpenChange={setIsViewTransactionModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden" />
        </DialogTrigger>

        <DialogContent className="max-w-3xl mx-auto p-6 rounded-lg bg-white shadow-xl overflow-hidden">
          {/* Modal Header */}
          <DialogHeader className="mb-4 border-b pb-3">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              {viewApproved ? "Approved Transactions" : "Pending Transactions"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {viewApproved
                ? "View all approved transactions."
                : "View all pending transactions."}
            </DialogDescription>
          </DialogHeader>

{/* Modal Body with Scrollable List */}
<div className="max-h-[400px] overflow-y-auto p-6 bg-white rounded-lg shadow-lg">
  {viewApproved ? (
    <div>
      <h3 className="text-2xl font-semibold mb-6 text-gray-900 border-b pb-3">Approved Transactions</h3>
      <ul className="space-y-4">
        {(approvedTransactions || []).map((transaction) => (
          <li
            key={transaction._id}
            className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm border-b-2 border-gray-300"
          >
            <span className="text-gray-700 text-lg">{transaction.itemName} (x{transaction.quantity})</span>
            <span className="text-gray-800 font-semibold text-lg">${transaction.totalPrice}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div>
      <h3 className="text-2xl font-semibold mb-6 text-gray-900 border-b pb-3">Pending Transactions</h3>
      <ul className="space-y-4">
        {(pendingTransactions || []).map((transaction) => (
          <li
            key={transaction._id}
            className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border-b-2 border-gray-300"
          >
            <span className="text-gray-700 text-lg">{transaction.itemName} (x{transaction.quantity})</span>
            <span className="text-gray-800 font-semibold text-lg">${transaction.totalPrice}</span>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>


          {/* Modal Footer with Actions */}
          <DialogFooter className="mt-4 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setIsViewTransactionModalOpen(false)}
              className="mr-2"
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => setViewApproved(!viewApproved)}
            >
              {viewApproved ? "View Pending" : "View Approved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>

  {/* Auction Component */}
  <div className="col-span-1 sm:col-span-2 lg:col-span-2 min-h-[300px]">
    <Auction />
  </div>
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

     
    {/* Products Section */}

    <h2 className="text-3xl font-semibold mb-1 text-left font-sans text-black">Products</h2>
     
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-black">Loading products...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-black">No products found matching "{searchQuery}"</p>
        ) : (
          filteredProducts.map((product) => {
            // Determine stock color based on quantity
            let stockColor = 'text-green-700'; // Default is green
            if (product.quantity < 10) {
              stockColor = 'text-red-500'; // Red if less than 10
            } else if (product.quantity < 30) {
              stockColor = 'text-yellow-500'; // Yellow if less than 30
            }

            return (
              <Card key={product._id}>
                <CardHeader className="bg-blue-500 text-white">
                  <h3 className="text-lg text-black">{product.name}</h3>
                </CardHeader>
                <CardContent>
                  {product.imageUrl && <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} className="w-full h-64 object-cover" />}
                  <p className="text-lg mt-2 text-black">{product.description}</p>
                  <p className="text-2xl font-bold mt-2 text-black">${product.price}</p>
                  <p className="text-sm text-black">Category: {product.category}</p>
                  
                  {/* Display size and color */}
                  {product.size && <p className="text-sm text-black">Size: {product.size}</p>}
                  {product.colour && <p className="text-sm text-black">Colour: {product.colour}</p>}
                  
                  {/* Stock text with dynamic color */}
                  <p className={`text-sm ${stockColor}`}>Stock: {product.quantity} available</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="outline" color="green" onClick={() => addToCart(product)}>
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

        {/* cart modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4 text-center border-b-2 pb-2">Your Cart</h2>
              {cart.length > 0 ? (
                <div>
                  <ul className="space-y-4">
                    {cart.map((item) => (
                      <li key={item._id} className="flex justify-between items-center border-b pb-2">
                        <div className="text-left">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-900">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">${(item.price * item.quantity)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total:</span>
                      <span>
                        $
                        {cart
                          .reduce((total, item) => total + item.price * item.quantity, 0)
                          }
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">Your cart is empty.</p>
              )}
              <div className="flex justify-between items-center mt-6">
                <Button variant="outline" color="gray" onClick={toggleModal}>
                  Close
                </Button>
                {cart.length > 0 && (
                  <Button variant="default" color="green" onClick={submitCart}>
                    Submit Order
                  </Button>
                )}
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
