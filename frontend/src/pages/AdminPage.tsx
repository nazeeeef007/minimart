import React, { useState , useEffect} from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';  // Assuming you are using ShadCN for input components
import { Button } from '@/components/ui/button'; // Assuming you are using ShadCN for buttons
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'; // Assuming you are using ShadCN for select dropdowns
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from "lucide-react";
import { toast } from 'react-toastify';
import SuspendUser from '@/components/SuspendUser'; // Import SuspendUser component
import ResetPassword from '@/components/ResetPassword'; // Import SuspendUser component
import ManageInventory from '@/components/ManageInventory';
import Dashboard from '@/components/Dashboard'; 
import AuditLog from '@/components/AuditLog'; 
import useLogout from '@/components/Logout'; // Import the useLogout hook
import InventorySummary from '@/components/InventorySummary'; 

const AdminPage: React.FC = () => {
  // User form states
  const handleLogout = useLogout();
  
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('resident');
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Product form states
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState(0);
  const [productQuantity, setProductQuantity] = useState(0);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSize, setProductSize] = useState('');
  const [productColour, setProductColour] = useState('');
  const [productError, setProductError] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);

    // Product requests list states
  const [orders, setOrders] = useState<any[]>([]); // Will hold the list of product requests
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);// To track the order being deleted
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [voucherRequests, setVoucherRequests] = useState<any[]>([]); 
  const [voucherRequestsLoading, setVoucherRequestsLoading] = useState(false);
  const [voucherRequestsError, setVoucherRequestsError] = useState<string | null>(null);
  const [approveVoucherLoading, setApproveVoucherLoading] = useState(false);
  const [rejectVoucherLoading, setRejectVoucherLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]); // List of users
  const [suspendUserloading, setSuspendUserLoading] = useState(false);
  const [suspendUserError, setSuspendUserError] = useState<string | null>(null);

     // Fetch users to display on admin page
  useEffect(() => {
    const fetchUsers = async () => {
      setSuspendUserLoading(true);
      setSuspendUserError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSuspendUserError('You must be logged in as admin to view users.');
          return;
        }

        const response = await axios.get(
          'http://localhost:5000/api/admin/getUsers',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success && Array.isArray(response.data.data)) {
          setUsers(response.data.data); // Set users to the state
        } else {
          setSuspendUserError('Failed to fetch users.');
        }
      } catch (err: any) {
        setSuspendUserError(err.response?.data?.message || 'Failed to fetch users.');
      } finally {
        setSuspendUserLoading(false);
      }
    };

    fetchUsers();
  }, []);
    // Fetch orders to approve on component mount
    useEffect(() => {
        const fetchOrders = async () => {
          setOrdersLoading(true);
          setOrdersError(null);
      
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              setOrdersError('You must be logged in to view orders.');
              return;
            }
      
            const response = await axios.get(
              'http://localhost:5000/api/admin/getOrders',
              { headers: { Authorization: `Bearer ${token}` } }
            );
            // console.log("ok")
            // console.log(response.data.data)
            // Check if response contains success and data
            if (response.data.success && Array.isArray(response.data.data)) {
              setOrders(response.data.data); // Access orders from the 'data' field
            } else {
              setOrdersError('Invalid response format, expected an array of orders.');
            }
          } catch (err: any) {
            setOrdersError(err.response?.data?.message || 'Failed to fetch orders.');
          } finally {
            setOrdersLoading(false);
          }
        };
      
        fetchOrders();
      }, []);
    
     // Fetch voucher requests on component mount
    useEffect(() => {
        const fetchVoucherRequests = async () => {
        setVoucherRequestsLoading(true);
        setVoucherRequestsError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
            setVoucherRequestsError('You must be logged in to view voucher requests.');
            return;
            }

            const response = await axios.get('http://localhost:5000/api/admin/getVoucherRequests', {
            headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && Array.isArray(response.data.data)) {
            setVoucherRequests(response.data.data);
            } else {
            setVoucherRequestsError('Invalid response format, expected an array of voucher requests.');
            }
        } catch (err: any) {
            setVoucherRequestsError(err.response?.data?.message || 'Failed to fetch voucher requests.');
        } finally {
            setVoucherRequestsLoading(false);
        }
        };

        fetchVoucherRequests();
    }, []);

    useEffect(() => {
      // Retrieve the username from localStorage
      const storedUsername = localStorage.getItem('username');
      setAdminUsername(storedUsername);
    }, []);

    interface VoucherRequest {
      _id: string;
      requestedAmount: number;
      status: string;
      requestDate: string;
      username: string;
      voucherBalance: number;
      userId: string;
      voucherOptionId: string;
  }
  
// Approve voucher request function
const handleApproveVoucher = async (voucherId: string) => {
  setApproveVoucherLoading(true);
  try {
      const token = localStorage.getItem('token');
      const adminId = localStorage.getItem('userId');
      if (!token) {
          setVoucherRequestsError('You must be logged in to approve voucher requests.');
          return;
      }

      // Send request to approve the voucher
      const response = await axios.post(
          `http://localhost:5000/api/admin/approveVoucherRequest`,
          { voucherRequestId: voucherId },
          { headers: { Authorization: `Bearer ${token}`, adminId : adminId } }
      );

      // Check if the response was successful
      if (response.data.success) {
          // Optionally, show success message
          toast.success(response.data.message, { position: 'top-center', autoClose: 5000 });

          // Fetch the updated voucher requests from the backend (only if necessary)
          const updatedVoucherRequests = response.data.data;

          // Update the state with the newly fetched data or just update the status
          setVoucherRequests((prev) => {
              return prev.map((user) => ({
                  ...user,
                  pendingRequests: user.pendingRequests.map((voucher: VoucherRequest) => {
                      if (voucher._id === voucherId) {
                          // Update the voucher's status to "Approved" locally
                          return { ...voucher, status: 'Approved' };
                      }
                      return voucher;
                  }),
              }));
          });
      } else {
          setVoucherRequestsError('Failed to approve voucher request.');
      }
  } catch (err: any) {
      setVoucherRequestsError(err.response?.data?.message || 'Failed to approve voucher request.');
  } finally {
      setApproveVoucherLoading(false);
  }
};

  
  // Reject voucher request function
const handleRejectVoucher = async (voucherId: string) => {
  const reason = prompt("Enter a reason for rejection (optional):");

  setRejectVoucherLoading(true);
  try {
      const token = localStorage.getItem('token');
      const adminId = localStorage.getItem('userId');
      if (!token) {
          setVoucherRequestsError('You must be logged in to reject voucher requests.');
          return;
      }

      const response = await axios.post(
          `http://localhost:5000/api/admin/rejectVoucherRequest`,
          { voucherRequestId: voucherId, reason },
          { headers: { Authorization: `Bearer ${token}`, adminId: adminId } }
      );

      if (response.data.success) {
          // Update only the specific voucher request that was rejected
          setVoucherRequests((prev) => 
              prev.map((user) => ({
                  ...user,
                  pendingRequests: user.pendingRequests.map((voucher: VoucherRequest) =>
                      voucher._id === voucherId
                          ? { ...voucher, status: 'Rejected', rejectionReason: reason }
                          : voucher
                  ),
              }))
          );

          toast.info('Voucher request rejected successfully!', {
              position: 'top-center',
              autoClose: 5000,
          });
      } else {
          setVoucherRequestsError(response.data.message || 'Failed to reject voucher request.');
      }
  } catch (err: any) {
      setVoucherRequestsError(err.response?.data?.message || 'Failed to reject voucher request.');
  } finally {
      setRejectVoucherLoading(false);
  }
};


      
      const handleApproveProduct = async (orderId: string, userId: string) => {
        setOrdersLoading(true);
        setOrdersError(null);
      
        try {
          const token = localStorage.getItem('token');
          const adminId = localStorage.getItem('userId');
          if (!token) {
            setOrdersError('You must be logged in to approve orders.');
            return;
          }
      
          const response = await axios.post(
            `http://localhost:5000/api/admin/approveProductRequest`,  // Notice the userId will be in the body now
            { orderId, userId },  // Send both orderId and userId in the request body
            { headers: { Authorization: `Bearer ${token}`, adminId : adminId } }
          );
      
          // Create a new list without the approved order
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order._id === orderId
                    ? { ...order, status: 'Completed' } // Change status to 'Completed'
                    : order
            )
        );
        toast.success('Product request approved successfully!', {
            position: 'top-center',
            autoClose: 5000, // Auto close after 5 seconds
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
        });
        } catch (err: any) {
          setOrdersError(err.response?.data?.message || 'Failed to approve product request.');
        } finally {
          setOrdersLoading(false);
        }
      };

      const handleRejectProduct = async (orderId: string, userId: string) => {
        const description = prompt("Enter a reason for rejection (optional):");
      
        setOrdersLoading(true);
        setOrdersError(null);
      
        try {
          const token = localStorage.getItem('token');
          const adminId = localStorage.getItem('userId');
          if (!token) {
            setOrdersError('You must be logged in to reject orders.');
            return;
          }
      
          const response = await axios.post(
            `http://localhost:5000/api/admin/rejectProductRequest`,
            { orderId, userId, description },
            { headers: { Authorization: `Bearer ${token}`, adminId : adminId } }
          );
      
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order._id === orderId
                    ? { ...order, status: 'Rejected', rejectionReason: description } // Update status to 'Rejected' and add reason
                    : order
            )
        );
      
          toast.info('Product request rejected successfully!', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          });
        } catch (err: any) {
          setOrdersError(err.response?.data?.message || 'Failed to reject product request.');
        } finally {
          setOrdersLoading(false);
        }
      };
    

      const handleDeleteRequest = async (orderId: string) => {
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            const adminId = localStorage.getItem('userId');
            if (!token) {
              setOrdersError('You must be logged in to reject orders.');
              return;
            }
            await axios.delete(`http://localhost:5000/api/admin/deleteProductRequest/${orderId}`, {
                headers: {
                  Authorization: `Bearer ${token}`, // Add token in the Authorization header
                  adminId: adminId,
                }
              });
          // Remove order from UI
          setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      
          // Show success message
          toast.success('Product request deleted successfully!', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          });
      
          setSelectedOrder(null); // Close the dialog
        } catch (error) {
          console.error('Failed to delete order:', error);
          toast.error('Failed to delete product request. Please try again.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          });
        } finally {
          setDeleteLoading(false);
        }
      };
      
      
      
    
      
  // Handle user form submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const adminId = localStorage.getItem('userId');
      if (!token) {
        setError('You must be logged in to perform this action.');
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/addUser',
        { username, email, password, role, voucherBalance, adminId},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('resident');
      setVoucherBalance(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle product form submission
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductLoading(true);
    setProductError(null);

    // Validate product data
    if (!productName || !productDescription || !productPrice || !productQuantity || !productCategory) {
      setProductError('All fields are required');
      setProductLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const adminId = localStorage.getItem('userId');
      if (!token) {
        setProductError('You must be logged in to add products.');
        setProductLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/admin/addProduct',
        { name: productName, description: productDescription, price: productPrice, quantity: productQuantity, imageUrl: productImageUrl, category: productCategory,adminId
          , colour: productColour, size: productSize
          },
        { headers: { Authorization: `Bearer ${token}` } }
      );

       toast.success(response.data.message);
      setProductName('');
      setProductDescription('');
      setProductPrice(0);
      setProductQuantity(0);
      setProductImageUrl('');
      setProductCategory('');
    } catch (err: any) {
      setProductError(err.response?.data?.message || 'Failed to add product. Please try again.');
    } finally {
      setProductLoading(false);
    }
  };

  const AddUserButton = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
</svg>

  )

  const AddProductButton = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
</svg>

  )
  
  const LogoutButton = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
  </svg>
  )

  return (
    <div className="admin-page space-y-6 p-6">
      <h2 className="text-xl font-semibold mb-4">{adminUsername}'s Dashboard</h2>
      <div className="flex justify-left gap-4">
      <img
        src="/muhammadiyah.png"// Replace with the actual image URL
        alt="Top Right Image"
        className="absolute top-5 right-10 h-34 w-48 " // Adjust size and position as needed
      />
      <AuditLog />
      
      {/* User creation form */}
       {/* Button to open the modal */}
       <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" title="Add User">
          <AddUserButton/>
          </Button>
        </DialogTrigger>

        {/* Modal Content */}
        <DialogContent className="max-w-lg w-full">
          <DialogTitle className="text-lg font-bold">Add User</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mb-4">
            Fill out the form below to add a new user.
          </DialogDescription>

          <form onSubmit={handleAddUser} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <label htmlFor="username" className="block text-sm font-medium">Username</label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'resident' && (
              <div>
                <label htmlFor="voucherBalance" className="block text-sm font-medium">
                  Voucher Balance
                </label>
                <Input
                  id="voucherBalance"
                  type="number"
                  value={voucherBalance}
                  onChange={(e) => setVoucherBalance(Number(e.target.value))}
                />
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding user...' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
  

     {/* Product creation form */}
<Dialog>
  <DialogTrigger asChild>
    <Button className="bg-blue-600 text-white hover:bg-blue-700" title="Add Product">
      <AddProductButton />
    </Button>
  </DialogTrigger>

  {/* Modal Content */}
  <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <DialogTitle className="text-lg font-bold">Add Product</DialogTitle>
    <DialogDescription className="text-sm text-gray-600 mb-4">
      Fill out the form below to add a new product.
    </DialogDescription>

    <form onSubmit={handleAddProduct} className="space-y-4">
      {productError && <p className="text-red-500 text-sm">{productError}</p>}

      <div>
        <label htmlFor="productName" className="block text-sm font-medium">
          Product Name
        </label>
        <Input
          id="productName"
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="productDescription" className="block text-sm font-medium">
          Product Description
        </label>
        <Input
          id="productDescription"
          type="text"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="productPrice" className="block text-sm font-medium">
          Price
        </label>
        <Input
          id="productPrice"
          type="number"
          value={productPrice}
          onChange={(e) => setProductPrice(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <label htmlFor="productQuantity" className="block text-sm font-medium">
          Quantity
        </label>
        <Input
          id="productQuantity"
          type="number"
          value={productQuantity}
          onChange={(e) => setProductQuantity(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <label htmlFor="productImageUrl" className="block text-sm font-medium">
          Product Image URL
        </label>
        <Input
          id="productImageUrl"
          type="text"
          value={productImageUrl}
          onChange={(e) => setProductImageUrl(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="productCategory" className="block text-sm font-medium">
          Category
        </label>
        <Input
          id="productCategory"
          type="text"
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          required
        />
      </div>

      {/* New Color Input */}
      <div>
        <label htmlFor="productColour" className="block text-sm font-medium">
          Colour
        </label>
        <Input
          id="productColour"
          type="text"
          value={productColour}
          onChange={(e) => setProductColour(e.target.value)}
        />
      </div>

      {/* New Size Input */}
      <div>
        <label htmlFor="productSize" className="block text-sm font-medium">
          Size
        </label>
        <Input
          id="productSize"
          type="text"
          value={productSize}
          onChange={(e) => setProductSize(e.target.value)}
        />
      </div>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={productLoading}>
          {productLoading ? 'Adding product...' : 'Add Product'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

< InventorySummary/>
      <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white"
      title = "Log Out">
        <LogoutButton/>
      </Button>
      </div>
      
      <Dashboard />
      <ManageInventory />
      <h1 className="text-2xl font-bold mb-4">Users</h1>

<div className="overflow-y-auto max-h-[400px]"> {/* Add max height and enable scrolling */}
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Username</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map(user => (
        <TableRow key={user._id}>
          <TableCell>{user.username}</TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell>{user.role}</TableCell>
          <TableCell>
            <SuspendUser
              userId={user._id}
              suspended={user.suspended}
              onSuspendChange={(newSuspendedState) => {
                // Update the user state directly in a more efficient way
                setUsers((prevUsers) =>
                  prevUsers.map((u) =>
                    u._id === user._id ? { ...u, suspended: newSuspendedState } : u
                  )
                );
              }}
            />
            <ResetPassword
              userId={user._id}
              onPasswordReset={() => {
                // Handle actions after password reset (e.g., notify the user, etc.)
                // toast.success('Password reset successfully.');
              }}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>


     {/* Orders List */}
<h1 className="text-2xl font-bold mb-4">Product Requests</h1>

{ordersLoading && (
  <div className="flex justify-center items-center">
    <Loader2 className="animate-spin w-6 h-6" />
    <p className="ml-2">Loading...</p>
  </div>
)}

{ordersError && <p className="text-red-500 mb-4">{ordersError}</p>}

{orders.length > 0 ? (
  <div className="overflow-y-auto max-h-[400px]"> {/* Add max height and enable scrolling */}
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="px-4 py-2 text-left">Username</TableHead>
          <TableHead className="px-4 py-2 text-left">Products</TableHead>
          <TableHead className="px-4 py-2 text-left">Total Price</TableHead>
          <TableHead className="px-4 py-2 text-left">Status</TableHead>
          <TableHead className="px-4 py-2 text-left">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order._id}>
            <TableCell className="px-4 py-2">{order.userId ? order.userId.username : order.username}</TableCell>
            <TableCell className="px-4 py-2">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="mb-1">
                  {item.name} (x{item.quantity}) - ${item.price}
                </div>
              ))}
            </TableCell>
            <TableCell className="px-4 py-2">{order.totalPrice}</TableCell>
            <TableCell className="px-4 py-2">
              <span
                className={`py-1 px-2 rounded-full ${
                  order.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {order.status}
              </span>
            </TableCell>
            <TableCell className="px-4 py-2">
              <Button
                variant="default"
                size="sm"
                className="bg-green-500"
                onClick={() => handleApproveProduct(order._id, order.userId._id)}
              >
                Approve
              </Button>
              <Button
                variant="default"
                size="sm"
                className="ml-2 bg-red-600"
                onClick={() => handleRejectProduct(order._id, order.userId._id)}
              >
                Reject
              </Button>
              {/* Delete Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2 bg-black"
                    onClick={() => setSelectedOrder(order)}
                  >
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <h2 className="text-lg font-bold">Confirm Deletion</h2>
                  <p>Are you sure you want to delete this order? This action cannot be undone.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedOrder(null)} disabled={deleteLoading}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => selectedOrder && handleDeleteRequest((selectedOrder as { _id: string })._id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Confirm'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
) : (
  <p className="text-center text-gray-600">No orders to display.</p>
)}
  
  <h1 className="text-2xl font-bold mb-4">Voucher Requests </h1>
  <div className="overflow-y-auto max-h-[400px]"> {/* Add max height and enable scrolling */}
{/* // Rendering voucher requests */}
<Table className="w-full">
  <TableHeader>
    <TableRow>
      <TableHead className="px-4 py-2 text-left">Username</TableHead>
      <TableHead className="px-4 py-2 text-left">Voucher ID</TableHead>
      <TableHead className="px-4 py-2 text-left">Amount</TableHead>
      <TableHead className="px-4 py-2 text-left">Status</TableHead>
      <TableHead className="px-4 py-2 text-left">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {voucherRequestsLoading ? (
      <TableRow>
        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
      </TableRow>
    ) : voucherRequestsError ? (
      <TableRow>
        <TableCell colSpan={5} className="text-center text-red-600">{voucherRequestsError}</TableCell>
      </TableRow>
    ) : voucherRequests.length === 0 ? (
      <TableRow>
        <TableCell colSpan={5} className="text-center">No voucher requests available</TableCell>
      </TableRow>
    ) : (
      voucherRequests.map((user: any) => (
        user.pendingRequests.map((voucher: any) => {
          let statusColor = '';
          if (voucher.status === 'Pending') {
            statusColor = 'bg-yellow-100 text-yellow-700';
          } else if (voucher.status === 'Approved') {
            statusColor = 'bg-green-100 text-green-700';
          } else if (voucher.status === 'Rejected') {
            statusColor = 'bg-red-100 text-red-700';
          }

          return (
            <TableRow key={voucher._id}>
              <TableCell className="px-4 py-2">{voucher.username}</TableCell>
              <TableCell className="px-4 py-2">{voucher._id}</TableCell>
              <TableCell className="px-4 py-2">{voucher.requestedAmount}</TableCell>
              <TableCell className="px-4 py-2">
                <span className={`text-white ${statusColor} py-1 px-2 rounded-full`}>
                  {voucher.status}
                </span>
              </TableCell>
              <TableCell className="px-4 py-2 space-x-2">
                <Button
                  disabled={approveVoucherLoading}
                  onClick={() => handleApproveVoucher(voucher._id)}
                  className="bg-green-500 text-white"
                  size="sm"
                >
                  {approveVoucherLoading ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  disabled={rejectVoucherLoading}
                  onClick={() => handleRejectVoucher(voucher._id)}
                  className="bg-red-600 text-white ml-2"
                  size="sm"
                >
                  {rejectVoucherLoading ? 'Rejecting...' : 'Reject'}
                </Button>
              </TableCell>
            </TableRow>
          );
        })
      ))
    )}
  </TableBody>
</Table>

</div>
    </div>

    
  );
};

export default AdminPage;
