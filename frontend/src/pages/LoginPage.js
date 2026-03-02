import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { seedDemoData } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Sun, Moon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoData();
      toast.success('Demo data created! Use admin@demo.com / admin123 to login');
      setEmail('admin@demo.com');
      setPassword('admin123');
    } catch (error) {
      if (error.response?.data?.detail?.includes('already exists')) {
        toast.info('Demo data already exists. Use admin@demo.com / admin123');
        setEmail('admin@demo.com');
        setPassword('admin123');
      } else {
        toast.error('Failed to seed demo data');
      }
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1769008302212-816b6a07e10c?crop=entropy&cs=srgb&fm=jpg&q=85')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">OpsCommand</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Facility Management<br />Made Simple
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Streamline your facility operations with intelligent work order management, 
              asset tracking, and preventive maintenance scheduling.
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 OpsCommand. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="login-theme-toggle">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">OpsCommand</span>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">
                First time? Create demo data to explore the system
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleSeedData}
                disabled={seeding}
                data-testid="seed-demo-btn"
              >
                {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Initialize Demo Data
              </Button>
              
              <div className="mt-4 text-xs text-muted-foreground space-y-1">
                <p><strong>Demo Credentials:</strong></p>
                <p>Admin: admin@demo.com / admin123</p>
                <p>Manager: manager@demo.com / manager123</p>
                <p>Technician: tech@demo.com / tech123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
