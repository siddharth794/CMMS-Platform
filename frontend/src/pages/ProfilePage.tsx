// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { usersApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    username: user?.username || ''
  });

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.updateProfile(profile);
      addNotification('success', 'Profile updated successfully');
    } catch (err: any) {
      addNotification('error', err.response?.data?.detail || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      return addNotification('error', 'Passwords do not match');
    }
    setLoading(true);
    try {
      await usersApi.updatePassword({ 
        current_password: pw.current_password, 
        new_password: pw.new_password 
      });
      addNotification('success', 'Password updated successfully');
      setPw({ current_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      addNotification('error', err.response?.data?.detail || 'Failed to update password');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Role</Label>
                <p className="font-medium">{(user?.role?.name || user?.Role?.name || '').replace('_', ' ')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" required value={pw.current_password} onChange={e => setPw({...pw, current_password: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" required value={pw.new_password} onChange={e => setPw({...pw, new_password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" required value={pw.confirm} onChange={e => setPw({...pw, confirm: e.target.value})} />
              </div>
            </div>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
