// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganization, useUpdateOrganization } from '../hooks/api/useOrganizations';
import { useUsers } from '../hooks/api/useUsers';
import { useWorkOrders } from '../hooks/api/useWorkOrders';
import { useAssetsData } from '../hooks/api/useAssets';
import { useInventoryData } from '../hooks/api/useInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft, Save, Building2, Globe, User as UserIcon, ClipboardList, Box, Package, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const OrganizationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { data: organization, isLoading, isError } = useOrganization(id);
  const updateMutation = useUpdateOrganization();

  // Associated Data Hooks
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ org_id: id, limit: 10 });
  const { data: workOrdersData, isLoading: isLoadingWO } = useWorkOrders({ org_id: id, limit: 10 });
  const { data: assetsData, isLoading: isLoadingAssets } = useAssetsData({ org_id: id, limit: 10 });
  const { data: inventoryData, isLoading: isLoadingInv } = useInventoryData({ org_id: id, limit: 10 });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    owner_name: '',
    website_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        address: organization.address || '',
        phone: organization.phone || '',
        email: organization.email || '',
        owner_name: organization.owner_name || '',
        website_url: organization.website_url || '',
        is_active: organization.is_active ?? true,
      });
    }
  }, [organization]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id,
        data: formData
      });
      addNotification('success', 'Organization updated successfully');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to update organization');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Organization not found</h2>
        <Button variant="link" onClick={() => navigate('/organizations')}>Back to Organizations</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organizations')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formData.name || organization.name}</h1>
        </div>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="flex w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6 overflow-x-auto">
          <TabsTrigger 
            value="info" 
            className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            <Building2 className="h-4 w-4" />
            <span className="font-medium">Info</span>
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            <UserIcon className="h-4 w-4" />
            <span className="font-medium">Users</span>
          </TabsTrigger>
          <TabsTrigger 
            value="work-orders" 
            className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="font-medium">Work Orders</span>
          </TabsTrigger>
          <TabsTrigger 
            value="assets" 
            className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            <Box className="h-4 w-4" />
            <span className="font-medium">Assets</span>
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            <Package className="h-4 w-4" />
            <span className="font-medium">Inventory</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Update name, contact info, and website</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner_name">Owner Name</Label>
                      <Input
                        id="owner_name"
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        placeholder="Founder or CEO"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{formData.is_active ? 'Active' : 'Inactive'}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      ID: {organization.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registered {format(new Date(organization.created_at), 'PP')}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${formData.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      {formData.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Primary Contact</span>
                    <span className="font-medium">{formData.email || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Organization Users
                </CardTitle>
                <CardDescription>Manage users belonging to this organization</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/users')}>
                Manage All Users
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.data?.length > 0 ? (
                      usersData.data.map((user) => (
                        <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/users/${user.id}`)}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell><Badge variant="outline">{user.Role?.name}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'success' : 'destructive'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No users found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Work Orders
                </CardTitle>
                <CardDescription>Recent service requests and maintenance tasks</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/work-orders')}>
                All Work Orders
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingWO ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrdersData?.data?.length > 0 ? (
                      workOrdersData.data.map((wo) => (
                        <TableRow key={wo.id} className="cursor-pointer" onClick={() => navigate(`/work-orders/${wo.id}`)}>
                          <TableCell className="font-medium">{wo.title}</TableCell>
                          <TableCell>
                            <Badge variant={wo.priority === 'high' ? 'destructive' : wo.priority === 'medium' ? 'warning' : 'secondary'}>
                              {wo.priority}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge>{wo.status}</Badge></TableCell>
                          <TableCell>{wo.Assignee?.username || 'Unassigned'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No work orders found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Assets
                </CardTitle>
                <CardDescription>Equipment and property management</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/assets')}>
                All Assets
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAssets ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetsData?.data?.length > 0 ? (
                      assetsData.data.map((asset) => (
                        <TableRow key={asset.id} className="cursor-pointer" onClick={() => navigate(`/assets/${asset.id}`)}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.asset_tag}</TableCell>
                          <TableCell className="capitalize">{asset.asset_type}</TableCell>
                          <TableCell><Badge variant="secondary">{asset.status}</Badge></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No assets found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory
                </CardTitle>
                <CardDescription>Parts and supplies tracking</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/inventory')}>
                Manage Inventory
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingInv ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData?.data?.length > 0 ? (
                      inventoryData.data.map((item) => (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(`/inventory/${item.id}`)}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <span className={item.quantity <= item.min_quantity ? 'text-red-500 font-bold' : ''}>
                              {item.quantity} {item.unit}
                            </span>
                          </TableCell>
                          <TableCell>{item.storage_location}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No inventory records found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationDetailPage;
