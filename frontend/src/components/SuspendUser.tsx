import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface SuspendUserProps {
  userId: string;
  suspended: boolean;
  onSuspendChange: (suspended: boolean) => void; // This callback will update the user suspension state in the parent
}

const SuspendUser: React.FC<SuspendUserProps> = ({ userId, suspended, onSuspendChange }) => {
    const [loading, setLoading] = useState(false);
  
    // Function to handle user suspension or unsuspension
    const handleSuspendOrUnsuspendUser = async () => {
        setLoading(true);
    
        try {
            const token = localStorage.getItem('token');
            const adminId = localStorage.getItem('userId');
            if (!token) {
                toast.error('You must be logged in as admin to modify user suspension status.');
                return;
            }
    
            // Use the new combined API route
            const url = `http://localhost:5000/api/admin/toggleSuspendUser/${userId}`;
            const response = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}`, adminId : adminId } });
    
            if (response.data.success) {
                // Success message based on whether user is suspended or unsuspended
                toast.success(response.data.message); // Use the message returned from the API
                onSuspendChange(!suspended); // Update the parent state to toggle suspension status
            } else {
                // This is the failure case for API response (e.g., if success is false)
                toast.error(`Failed to toggle user suspension: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err: any) {
            // This catches network issues or unexpected errors
            const message = err.response?.data?.message || 'Failed to modify user suspension';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };
  
    return (
      <Button
        variant={suspended ? 'outline' : 'destructive'}
        onClick={handleSuspendOrUnsuspendUser}
        disabled={loading}
      >
        {suspended ? 'Unsuspend User' : 'Suspend User'}
      </Button>
    );
};

export default SuspendUser;