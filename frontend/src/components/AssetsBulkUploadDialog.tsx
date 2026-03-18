// @ts-nocheck
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { assetsApi } from '../lib/api';
import { useOrganizations } from '../hooks/api/useOrganizations';
import { useSites } from '../hooks/api/useSites';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const AssetsBulkUploadDialog = ({ onUploadSuccess }) => {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [assetsToUpload, setAssetsToUpload] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const { addNotification } = useNotification();
    const { hasRole, user } = useAuth();

    const isSuperAdmin = hasRole(['super_admin']);
    const isOrgAdmin = hasRole(['org_admin']);
    const isFacilityManager = hasRole(['facility_manager']);

    const { data: orgsData } = useOrganizations({ limit: 1000 });
    const organizations = orgsData?.data || [];
    
    // Filter sites based on selected org if super admin, or user's org if org admin
    const sitesParams = { limit: 1000 };
    if (isSuperAdmin && selectedOrgId) {
        sitesParams.org_id = selectedOrgId;
    } else if (isOrgAdmin) {
        sitesParams.org_id = user?.org_id;
    }
    
    const { data: sitesData } = useSites(sitesParams);
    const sites = sitesData?.data || [];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            parseExcel(selectedFile);
        } else {
            setAssetsToUpload([]);
        }
    };

    const parseExcel = (selectedFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const workSheet = workbook.Sheets[sheetName];

                // Convert to JSON array of objects
                const json = XLSX.utils.sheet_to_json(workSheet);

                // Map common column headers to API field names
                const mappedAssets = json.map(row => ({
                    name: row['Name'] || row['name'] || '',
                    asset_tag: row['Asset Tag'] || row['asset_tag'] || row['Tag'] || '',
                    asset_type: row['Type'] || row['asset_type'] || 'movable',
                    category: row['Category'] || row['category'] || '',
                    description: row['Description'] || row['description'] || '',
                    location: row['Location'] || row['location'] || '',
                    manufacturer: row['Manufacturer'] || row['manufacturer'] || '',
                    model: row['Model'] || row['model'] || '',
                    serial_number: row['Serial Number'] || row['serial_number'] || row['Serial'] || '',
                    purchase_date: row['Purchase Date'] || row['purchase_date'] || null,
                    purchase_cost: row['Purchase Cost'] || row['purchase_cost'] || null,
                    warranty_expiry: row['Warranty Expiry'] || row['warranty_expiry'] || null,
                    status: row['Status'] || row['status'] || 'active',
                })).filter(asset => asset.name); // Filter out empty rows without a name

                setAssetsToUpload(mappedAssets);
            } catch (error) {
                addNotification('error', 'Failed to parse the Excel file. Please ensure it is correctly formatted.');
                setFile(null);
                setAssetsToUpload([]);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleUpload = async () => {
        if (assetsToUpload.length === 0) {
            addNotification('error', 'No valid assets found in the file to upload.');
            return;
        }

        setUploading(true);
        try {
            const payload = { 
                assets: assetsToUpload,
                org_id: isSuperAdmin ? selectedOrgId : (isOrgAdmin || isFacilityManager ? user?.org_id : undefined),
                site_id: isFacilityManager ? (user?.managed_site?.id || user?.site_id) : selectedSiteId
            };
            
            await assetsApi.bulkCreate(payload);
            addNotification('success', `Successfully imported ${assetsToUpload.length} assets`);
            setOpen(false);
            setFile(null);
            setAssetsToUpload([]);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstField = Object.keys(errors)[0];
                const firstError = Array.isArray(errors[firstField]) ? errors[firstField][0] : errors[firstField];
                addNotification('error', `Validation failed: ${firstField} - ${firstError}`);
            } else {
                addNotification('error', error.response?.data?.detail || 'Failed to upload assets');
            }
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { 
                Name: 'HVAC Unit 1', 
                'Asset Tag': 'ASSET-001',
                Type: 'immovable', 
                Category: 'HVAC',
                Location: 'Roof', 
                Manufacturer: 'Trane', 
                Model: 'XL15i', 
                'Serial Number': 'TR-12345', 
                'Purchase Date': '2023-01-15',
                'Purchase Cost': '5000',
                'Warranty Expiry': '2028-01-15',
                Status: 'active', 
                Description: 'Main building cooling unit' 
            },
            { 
                Name: 'Backup Generator', 
                'Asset Tag': 'ASSET-002',
                Type: 'movable', 
                Category: 'Power',
                Location: 'Basement', 
                Manufacturer: 'Caterpillar', 
                Model: 'C15', 
                'Serial Number': 'CAT-98765', 
                'Purchase Date': '2022-06-20',
                'Purchase Cost': '15000',
                'Warranty Expiry': '2027-06-20',
                Status: 'active', 
                Description: 'Emergency power' 
            }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Asset_Import_Template.xlsx');
    };

    const resetState = () => {
        setFile(null);
        setAssetsToUpload([]);
        setSelectedOrgId('');
        setSelectedSiteId('');
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" data-testid="bulk-upload-btn">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Bulk Import Assets</DialogTitle>
                    <DialogDescription>
                        Upload an Excel (.xlsx) or CSV file containing your assets.
                        <button onClick={downloadTemplate} className="text-primary hover:underline ml-1">
                            Download template
                        </button>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Role-based Org/Site Selection */}
                    <div className="space-y-4 border-b pb-4">
                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <Label>Organization</Label>
                                <Select value={selectedOrgId} onValueChange={(v) => { setSelectedOrgId(v); setSelectedSiteId(''); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.map(o => (
                                            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(isSuperAdmin || isOrgAdmin) && (
                            <div className="space-y-2">
                                <Label>Site</Label>
                                <Select value={selectedSiteId} onValueChange={setSelectedSiteId} disabled={isSuperAdmin && !selectedOrgId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isSuperAdmin && !selectedOrgId ? "Select organization first" : "Select Site"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sites.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {isFacilityManager && (
                            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                Assets will be automatically assigned to <strong>{user?.managed_site?.name || user?.site?.name || 'your assigned site'}</strong>.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/20 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">XLSX or CSV</p>
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                            <span className="text-muted-foreground">
                                ({assetsToUpload.length} valid assets found)
                            </span>
                        </div>
                    )}

                    {file && assetsToUpload.length === 0 && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <p>No valid assets found. Ensure your file has a column named "Name".</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={
                            uploading || 
                            !file || 
                            assetsToUpload.length === 0 || 
                            (isSuperAdmin && (!selectedOrgId || !selectedSiteId)) || 
                            (isOrgAdmin && !selectedSiteId)
                        }
                    >
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AssetsBulkUploadDialog;
