import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface ResetPasswordProps {
  userId: string;
  onPasswordReset: () => void; // Callback to notify the parent component of the password reset
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ userId, onPasswordReset }) => {
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const adminId = localStorage.getItem('userId');
      if (!token) {
        toast.error('You must be logged in as admin to reset user password.');
        return;
      }

      const url = `http://localhost:5000/api/admin/resetPassword/${userId}`;
      const response = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` , adminId : adminId} });

      if (response.data.success) {
        toast.success(response.data.message);
        onPasswordReset(); // Notify the parent that the password has been reset
      } else {
        toast.error(`Failed to reset password: ${response.data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleResetPassword}
      disabled={loading}
    >
      Reset Password
    </Button>
  );
};

export default ResetPassword;
