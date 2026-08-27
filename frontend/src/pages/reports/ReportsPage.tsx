import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { useGroup } from '../../context/GroupContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent } from '../../components/ui/card';
import { FileText, Download, FileSpreadsheet, Banknote, Receipt, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export const ReportsPage: React.FC = () => {
  const { activeYear } = useFestivalYear();
  const { t } = useTranslation();
  const { activeGroupId } = useGroup();
  const [reportType, setReportType] = useState('cash-book');
  const [data, setData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportFilename, setExportFilename] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!activeYear || !activeGroupId) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/reports/${reportType}?yearId=${activeYear.id}`, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId
        }
      });
      if (res.ok) {
        const jsonData = await res.json();
        console.log('Report data:', jsonData);
        setData(jsonData);
      } else {
        console.error('Report fetch failed:', await res.text());
      }
    };
    fetchData();
  }, [reportType, activeYear, activeGroupId]);

  const handleExportSubmit = async () => {
    if (!activeYear || !activeGroupId) return;
    
    if (!exportFilename.trim()) {
       alert("Please enter a filename");
       return;
    }
    
    const ext = exportFormat === 'excel' ? '.xlsx' : `.${exportFormat}`;
    const userFilename = exportFilename.endsWith(ext) ? exportFilename : `${exportFilename}${ext}`;

    try {
      setIsExporting(true);
      setIsExportModalOpen(false);
      const { data: { session } } = await supabase.auth.getSession();
      
      let url = `/api/reports/${reportType}/export?yearId=${activeYear.id}&format=${exportFormat}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId
        }
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      
      a.download = userFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!activeYear) return <div className="p-8">{t('reports.noActiveYear')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('reports.title')}</h2>
          <p className="text-muted-foreground">{t('reports.desc', { year: activeYear.year })}</p>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={() => {
              setExportFilename(`${reportType}-${activeYear.year}`);
              setIsExportModalOpen(true);
            }} 
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6">
        {[
          { id: 'cash-book', label: t('reports.cashBook'), icon: <FileText className="h-6 w-6 mb-2" /> },
          { id: 'donation-report', label: t('reports.donationReport'), icon: <Banknote className="h-6 w-6 mb-2" /> },
          { id: 'expense-report', label: t('reports.expenseReport'), icon: <Receipt className="h-6 w-6 mb-2" /> }
        ].map(report => (
          <Card 
            key={report.id} 
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${reportType === report.id ? 'border-brass bg-brass/5 shadow-sm' : 'hover:border-brass/40'}`}
            onClick={() => setReportType(report.id)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className={reportType === report.id ? 'text-brass' : 'text-muted-foreground'}>
                {report.icon}
              </div>
              <h3 className={`font-medium ${reportType === report.id ? 'text-brass' : 'text-textPrimary'}`}>{report.label}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-brass/20 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {data.length > 0 && (
                <TableRow className="border-brass/10 hover:bg-transparent">
                  {Object.keys(data[0]).map(k => <TableHead key={k} className="font-semibold text-brass">{k.toUpperCase()}</TableHead>)}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell className="text-center py-8 text-textSecondary">{t('reports.noData')}</TableCell></TableRow>}
              {data.map((row, i) => (
                <TableRow key={i} className="border-brass/10 hover:bg-brass/5">
                  {Object.values(row).map((v: any, j) => <TableCell key={j} className="text-textPrimary">{v}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input value={exportFilename} onChange={e => setExportFilename(e.target.value)} placeholder="Enter file name..." />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-2">
                <Button type="button" variant={exportFormat === 'pdf' ? 'default' : 'outline'} onClick={() => setExportFormat('pdf')} className="flex-1">PDF</Button>
                <Button type="button" variant={exportFormat === 'excel' ? 'default' : 'outline'} onClick={() => setExportFormat('excel')} className="flex-1">Excel</Button>
                <Button type="button" variant={exportFormat === 'csv' ? 'default' : 'outline'} onClick={() => setExportFormat('csv')} className="flex-1">CSV</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleExportSubmit} className="w-full mt-4" disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
