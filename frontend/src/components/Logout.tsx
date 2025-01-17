import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const useLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call the logout endpoint
      const response = await axios.post('http://localhost:5000/api/auth/logout', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      // Clear local storage
      localStorage.removeItem('role');
      localStorage.removeItem('token');

      // Notify user
      toast.success('Logged out successfully!');

      // Redirect to login page
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
      console.error(error);
    }
  };

  return handleLogout;
};

export default useLogout;
