// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, ArrowLeft, Save, Building2, Users, MapPin, UserPlus, Trash2 } from 'lucide-react';
import { useSite, useCreateSite, useUpdateSite, useAssignSiteManager, useAssignSiteTechnician, useRemoveSiteTechnician } from '../../hooks/api/useSites';
import { useUsers } from '../../hooks/api/useUsers';
import { Site, User } from '../../types/models';

export default function SiteDetails() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const { data: site, isLoading, isError } = useSite(id as string);
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const assignManagerMutation = useAssignSiteManager();
  const assignTechnicianMutation = useAssignSiteTechnician();
  const removeTechnicianMutation = useRemoveSiteTechnician();

  // For selecting users
  const { data: usersData } = useUsers({ limit: 100 });

  // Handle potential paginated wrapper or array structure for users
  const allUsers = Array.isArray(usersData) ? usersData : (usersData?.data || []);

  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    phone: '',
    description: '',
    is_active: true,
  });

  const [selectedManager, setSelectedManager] = useState<string>('none');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');

  useEffect(() => {
    if (site && !isNew) {
      setFormData({
        name: site.name || '',
        address: site.address || '',
        city: site.city || '',
        state: site.state || '',
        zip_code: site.zip_code || '',
        country: site.country || '',
        phone: site.phone || '',
        description: site.description || '',
        is_active: site.is_active ?? true,
      });
      setSelectedManager(site.manager_id || 'none');
    }
  }, [site, isNew]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) {
        // Create Site
        const payload = { ...formData };
        if (selectedManager !== 'none') {
          payload.manager_id = selectedManager;
        }
        await createMutation.mutateAsync(payload);
        addNotification('success', 'Site created successfully');
        navigate('/sites');
      } else {
        // Update Site Info
        await updateMutation.mutateAsync({ id: id as string, data: formData });
        
        // Update Manager separately if changed
        if (selectedManager !== (site?.manager_id || 'none')) {
          await assignManagerMutation.mutateAsync({
            id: id as string,
            managerId: selectedManager === 'none' ? null : selectedManager,
          });
        }
        
        addNotification('success', 'Site updated successfully');
      }
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || error.response?.data?.error || `Failed to ${isNew ? 'create' : 'update'} site`);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;
    try {
      await assignTechnicianMutation.mutateAsync({
        id: id as string,
        userId: selectedTechnician,
      });
      addNotification('success', 'Technician assigned successfully');
      setSelectedTechnician('');
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || error.response?.data?.error || 'Failed to assign technician');
    }
  };

  const handleRemoveTechnician = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this technician from the site?')) {
      try {
        await removeTechnicianMutation.mutateAsync({
          id: id as string,
          userId,
        });
        addNotification('success', 'Technician removed successfully');
      } catch (error: any) {
        addNotification('error', error.response?.data?.detail || error.response?.data?.error || 'Failed to remove technician');
      }
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if ((isError || !site) && !isNew) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Site not found</h2>
        <Button variant="link" onClick={() => navigate('/sites')}>Back to Sites</Button>
      </div>
    );
  }

  // Filter users by role
  const facilityManagers = allUsers.filter((u: User) => {
    const roleName = u.Role?.name || u.role?.name || '';
    const roleNameLower = roleName.toLowerCase();
    return roleNameLower === 'facility manager' || roleNameLower === 'facility_manager';
  });
  const technicians = allUsers.filter((u: User) => {
    const roleName = u.Role?.name || u.role?.name || '';
    return roleName.toLowerCase() === 'technician';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sites')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Create Site' : formData.name || site?.name}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={isNew ? createMutation.isPending : updateMutation.isPending || assignManagerMutation.isPending}>
          {(isNew ? createMutation.isPending : updateMutation.isPending) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isNew ? 'Create Site' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="flex w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6">
          <TabsTrigger value="info" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">Details & Settings</span>
          </TabsTrigger>
          {!isNew && (
            <TabsTrigger value="users" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              <Users className="h-4 w-4" />
              <span className="font-medium">Team Management</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="manager">Facility Manager</Label>
                  <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Facility Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Unassigned --</SelectItem>
                      {facilityManagers.map((fm: User) => (
                        <SelectItem key={fm.id} value={fm.id}>
                          {fm.first_name} {fm.last_name} ({fm.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Only users with the Facility Manager role are listed.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP / Postal Code</Label>
                    <Input id="zip_code" name="zip_code" value={formData.zip_code} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="phone">Site Phone Number</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {!isNew && (
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Assigned Technicians</CardTitle>
                  <CardDescription>Manage technicians assigned to this site.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.filter((t: User) => t.site_id !== site?.id).map((t: User) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignTechnician} disabled={!selectedTechnician || assignTechnicianMutation.isPending}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {site?.technicians && site.technicians.length > 0 ? (
                      site.technicians.map((tech: User) => (
                        <TableRow key={tech.id}>
                          <TableCell className="font-medium">{tech.first_name} {tech.last_name}</TableCell>
                          <TableCell>{tech.email}</TableCell>
                          <TableCell>{tech.phone || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveTechnician(tech.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No technicians currently assigned to this site.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
