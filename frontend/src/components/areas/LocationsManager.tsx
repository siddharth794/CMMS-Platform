// @ts-nocheck
import React, { useState } from 'react';
import { useFloors, useAreas, useMutateAreaTask } from '../../hooks/api/useAreas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, MapPin, Printer } from 'lucide-react';
import { areasApi } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../context/NotificationContext';
import QRCode from 'react-qr-code';
import { Trash2 } from 'lucide-react';

export function LocationsManager({ siteId, orgId }: { siteId: string, orgId: string }) {
  const { data: floors = [], isLoading } = useFloors(siteId);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  const { data: areas = [] } = useAreas(selectedFloor || undefined);
  const { deleteFloorMutation, deleteAreaMutation } = useMutateAreaTask();
  const { addNotification } = useNotification();

  const floorsList = Array.isArray(floors) ? floors : (floors?.data || []);
  const areasList = Array.isArray(areas) ? areas : (areas?.data || []);

  const handleDeleteFloor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this floor and all its areas?")) return;
    try {
      await deleteFloorMutation.mutateAsync(id);
      addNotification("success", "Floor deleted");
      if (selectedFloor === id) setSelectedFloor(null);
    } catch (err: any) {
      addNotification("error", err.response?.data?.error || "Failed to delete floor");
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this area?")) return;
    try {
      await deleteAreaMutation.mutateAsync(id);
      addNotification("success", "Area deleted");
    } catch (err: any) {
      addNotification("error", err.response?.data?.error || "Failed to delete area");
    }
  };

  if (isLoading) return <div>Loading locations...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left Column: Floors */}
      <div className="w-full md:w-1/3 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Floors</h3>
          <CreateFloorDialog siteId={siteId} />
        </div>
        <div className="space-y-2">
          {(!floorsList || floorsList.length === 0) ? (
            <p className="text-sm text-gray-500">No floors added yet.</p>
          ) : (
            floorsList.map((floor: any) => (
              <div
                key={floor.id}
                onClick={() => setSelectedFloor(floor.id)}
                className={`group p-3 rounded-md border cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center ${selectedFloor === floor.id ? 'border-primary bg-slate-50 ring-1 ring-primary' : ''}`}
              >
                <div>
                  <div className="font-medium">{floor.name}</div>
                  {floor.level !== undefined && <div className="text-xs text-gray-500">Level {floor.level}</div>}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={(e) => handleDeleteFloor(floor.id, e)}
                  title="Delete Floor"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Areas for selected floor */}
      <div className="w-full md:w-2/3 space-y-4">
        {selectedFloor ? (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Areas</h3>
              <CreateAreaDialog floorId={selectedFloor} />
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!areasList || areasList.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">No areas found for this floor.</TableCell>
                  </TableRow>
                ) : (
                  areasList.map((area: any) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {area.name}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{area.type?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/areas/${area.id}`}>Manage</Link>
                        </Button>
                        <PrintQrDialog area={area} />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteArea(area.id)}
                          title="Delete Area"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center text-gray-500">
            Select a floor to view its areas
          </div>
        )}
      </div>
    </div>
  );
}

function CreateFloorDialog({ siteId }: { siteId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState(0);
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await areasApi.createFloor({ site_id: siteId, name, level });
      addNotification('success', 'Floor created successfully');
      queryClient.invalidateQueries({ queryKey: ['floors', siteId] });
      setOpen(false);
      setName('');
      setLevel(0);
    } catch (error: any) {
      addNotification('error', error.response?.data?.error || 'Failed to create floor');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Floor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Floor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Floor Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ground Floor" required />
          </div>
          <div className="space-y-2">
            <Label>Level (Number)</Label>
            <Input type="number" value={level} onChange={e => setLevel(Number(e.target.value))} required />
          </div>
          <Button type="submit" className="w-full">Create Floor</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateAreaDialog({ floorId }: { floorId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await areasApi.createArea({ floor_id: floorId, name, type });
      addNotification('success', 'Area created successfully');
      queryClient.invalidateQueries({ queryKey: ['areas', floorId] });
      setOpen(false);
      setName('');
      setType('other');
    } catch (error: any) {
      addNotification('error', error.response?.data?.error || 'Failed to create area');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Area</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Area</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Area Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Men's Washroom L1" required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="washroom">Washroom</SelectItem>
                <SelectItem value="food_court">Food Court</SelectItem>
                <SelectItem value="corridor">Corridor</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Create Area</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PrintQrDialog({ area }: { area: any }) {
  const handlePrint = () => {
    const printContent = document.getElementById(`qr-print-${area.id}`);
    const winPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (winPrint && printContent) {
      winPrint.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${area.name}</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { border: 2px dashed #ccc; padding: 40px; text-align: center; border-radius: 12px; }
              h1 { margin-bottom: 20px; color: #333; }
              p { margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>${area.name}</h1>
              ${printContent.innerHTML}
              <p>Scan to Start Checklist</p>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      winPrint.document.close();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Printer className="h-4 w-4 mr-2" /> Print QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col items-center">
        <DialogHeader>
          <DialogTitle>QR Code for {area.name}</DialogTitle>
        </DialogHeader>
        
        <div id={`qr-print-${area.id}`} className="bg-white p-6 border rounded-lg shadow-sm">
          <QRCode 
            value={area.qr_code_hash}
            size={256}
            level="H"
          />
        </div>
        
        <p className="text-sm text-center text-muted-foreground mt-4">
          Print this code and stick it physically at the location. Staff will scan it to unlock their checklists.
        </p>
        
        <Button onClick={handlePrint} className="w-full mt-4">
          <Printer className="h-4 w-4 mr-2" /> Print Poster
        </Button>
      </DialogContent>
    </Dialog>
  );
}