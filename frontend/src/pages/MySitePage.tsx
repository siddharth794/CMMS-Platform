// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Building2, MapPin, Users, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSites, useSite } from '../hooks/api/useSites';
import { LocationsManager } from '../components/areas/LocationsManager';

export default function MySitePage() {
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
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Site Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Site Name</p>
                    <p className="text-base font-semibold">{mySite.name}</p>
                  </div>
                  {mySite.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-base">{mySite.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mySite.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {mySite.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {mySite.address && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-base">{mySite.address}</p>
                    </div>
                  )}
                  {location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">City / State / Country</p>
                      <p className="text-base">{location}</p>
                    </div>
                  )}
                  {mySite.zip_code && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ZIP / Postal Code</p>
                      <p className="text-base">{mySite.zip_code}</p>
                    </div>
                  )}
                  {mySite.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-base">{mySite.phone}</p>
                      </div>
                    </div>
                  )}
                  {!mySite.address && !location && !mySite.zip_code && !mySite.phone && (
                    <p className="text-muted-foreground text-sm">No location details available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Technicians</p>
                    <p className="text-2xl font-bold">{mySite.technicians?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="text-lg font-semibold truncate">{mySite.Organization?.name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-lg font-semibold truncate">{mySite.city || mySite.state || 'N/A'}</p>
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
                  {mySite.technicians && mySite.technicians.length > 0 ? (
                    mySite.technicians.map((tech: any) => (
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
      </Tabs>
    </div>
  );
}
