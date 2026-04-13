// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Building2, MapPin, Users, Phone, Mail, Globe, Copy, Check, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSites, useSite } from '../hooks/api/useSites';
import { LocationsManager } from '../components/areas/LocationsManager';

export default function MySitePage() {
  const [copiedAddress, setCopiedAddress] = React.useState(false);
  const [copiedPhone, setCopiedPhone] = React.useState(false);
  const { user } = useAuth();

  // Step 1: Fetch all sites for the org to find the manager's site
  const { data: sitesData, isLoading: listLoading, isError: listError } = useSites({ limit: 100 });
  const sites = sitesData?.data || [];
  const mySiteFromList = sites.find((s: any) => s.manager_id === user?.id);

  // Step 2: Fetch full site details (with technicians) once we know the site ID
  const { data: fullSite, isLoading: detailLoading } = useSite(mySiteFromList?.id || '');

  const isLoading = listLoading || (mySiteFromList && detailLoading);
  const mySite = fullSite || mySiteFromList;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (listError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Failed to load site data</h2>
        <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!mySite) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">No Site Assigned</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You have not been assigned as a facility manager to any site yet. Please contact your administrator to get assigned.
        </p>
      </div>
    );
  }

  const location = [mySite.city, mySite.state, mySite.country].filter(Boolean).join(', ');

  const handleCopy = (text: string, type: 'address' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const getRoleName = (u: any) => (u.Role?.name || u.role?.name || u.role_name || u.Roles?.[0]?.name || '').toLowerCase();
  
  const technicians = mySite?.technicians?.filter((u: any) => getRoleName(u) === 'technician') || [];
  const cleaners = mySite?.technicians?.filter((u: any) => getRoleName(u) === 'cleaning_staff') || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          {mySite.name}
        </h1>
        <p className="text-muted-foreground ml-[52px]">Your assigned site — manage locations, view details and team</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6">
          <TabsTrigger value="overview" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Floors & Areas</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Users className="h-4 w-4" />
            <span className="font-medium">Technicians</span>
          </TabsTrigger>
          <TabsTrigger value="cleaners" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Users className="h-4 w-4" />
            <span className="font-medium">Cleaners</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Information Card */}
            <Card className="overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl relative z-10">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  Site Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 relative z-10">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Name
                  </p>
                  <p className="text-lg font-semibold">{mySite.name}</p>
                </div>
                {mySite.description && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Description
                    </p>
                    <p className="text-base leading-relaxed bg-muted/30 p-3 rounded-md border">{mySite.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <p className="text-sm font-medium text-muted-foreground">Operational Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${mySite.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${mySite.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {mySite.is_active ? 'Active & Running' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card className="overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl relative z-10">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                    <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  {(mySite.address || location) && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group/item">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Primary Address</p>
                        <p className="text-base font-medium">{mySite.address}</p>
                        <p className="text-sm text-muted-foreground">{location} {mySite.zip_code}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover/item:opacity-100 h-8 w-8 transition-opacity" 
                        onClick={() => handleCopy(`${mySite.address || ''} ${location} ${mySite.zip_code || ''}`.trim(), 'address')}
                      >
                        {copiedAddress ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  )}
                  
                  {mySite.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group/item">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                        <a href={`tel:${mySite.phone}`} className="text-base font-medium hover:text-primary transition-colors">{mySite.phone}</a>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover/item:opacity-100 h-8 w-8 transition-opacity"
                        onClick={() => handleCopy(mySite.phone, 'phone')}
                      >
                        {copiedPhone ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  )}

                  {!mySite.address && !location && !mySite.zip_code && !mySite.phone && (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg text-center">
                      <Globe className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm font-medium">No location details available.</p>
                      <p className="text-xs text-muted-foreground mt-1">Contact your administrator to add address details.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Technicians</p>
                    <p className="text-2xl font-bold">{technicians.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Cleaners</p>
                    <p className="text-2xl font-bold">{cleaners.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-medium">Organization</p>
                    <p className="text-lg font-semibold truncate" title={mySite.Organization?.name}>{mySite.Organization?.name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-medium">Location</p>
                    <p className="text-lg font-semibold truncate" title={mySite.city || mySite.state || 'N/A'}>{mySite.city || mySite.state || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Floors & Areas Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Floors & Areas</CardTitle>
              <CardDescription>Manage physical locations and QR codes for area checklists at your site.</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationsManager siteId={mySite.id} orgId={mySite.org_id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Technicians</CardTitle>
              <CardDescription>Technicians currently assigned to your site.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicians.length > 0 ? (
                    technicians.map((tech: any) => (
                      <TableRow key={tech.id}>
                        <TableCell className="font-medium">{tech.first_name} {tech.last_name}</TableCell>
                        <TableCell>{tech.email}</TableCell>
                        <TableCell>{tech.phone || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No technicians currently assigned to your site.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cleaners Tab */}
        <TabsContent value="cleaners">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Cleaners</CardTitle>
              <CardDescription>Cleaning staff currently assigned to your site.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaners.length > 0 ? (
                    cleaners.map((cleaner: any) => (
                      <TableRow key={cleaner.id}>
                        <TableCell className="font-medium">{cleaner.first_name} {cleaner.last_name}</TableCell>
                        <TableCell>{cleaner.email}</TableCell>
                        <TableCell>{cleaner.phone || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No cleaners currently assigned to your site.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
