import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '../components/auth/LoginForm'; // Default import
import SignupForm from '../components/auth/SignupForm'; // Default import

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-lg">
        <Tabs defaultValue="login" onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
          <TabsList className="flex space-x-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            {/* Pass the activeTab or some other prop to LoginForm if needed */}
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
