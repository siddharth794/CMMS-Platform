// @ts-nocheck
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { assetsApi } from '../lib/api';

const AssetsBulkUploadDialog = ({ onUploadSuccess }) => {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [assetsToUpload, setAssetsToUpload] = useState([]);
    const { addNotification } = useNotification();

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
                    purchase_date: row['Purchase Date'] || row['purchase_date'] || '',
                    purchase_cost: row['Purchase Cost'] || row['purchase_cost'] || '',
                    warranty_expiry: row['Warranty Expiry'] || row['warranty_expiry'] || '',
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
            await assetsApi.bulkCreate({ assets: assetsToUpload });
            addNotification('success', `Successfully imported ${assetsToUpload.length} assets`);
            setOpen(false);
            setFile(null);
            setAssetsToUpload([]);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            addNotification('error', error.response?.data?.detail || 'Failed to upload assets');
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
                        disabled={uploading || !file || assetsToUpload.length === 0}
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
