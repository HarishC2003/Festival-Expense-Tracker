import { supabaseAdmin } from '../config/supabase';
// @ts-ignore
import PDFDocument from 'pdfkit-table';
import ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';

export class ReportsService {
  static async getReportData(type: string, yearId: string, groupId: string, startDate?: string, endDate?: string) {
    switch (type) {
      case 'cash-book': {
        let incQuery = supabaseAdmin.from('cash_donations').select('donation_date, receipt_number, amount, donors(name), income_categories(name)')
          .eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
        let expQuery = supabaseAdmin.from('expenses').select('expense_date, description, amount, expense_categories(name), committee_members!paid_by(name), vendors(name)')
          .eq('festival_year_id', yearId).eq('group_id', groupId).in('status', ['approved', 'reimbursed']).is('deleted_at', null);
          
        if (startDate) { incQuery = incQuery.gte('donation_date', startDate); expQuery = expQuery.gte('expense_date', startDate); }
        if (endDate) { incQuery = incQuery.lte('donation_date', endDate); expQuery = expQuery.lte('expense_date', endDate); }
        
        const [incRes, expRes] = await Promise.all([incQuery, expQuery]);
        
        if (incRes.error) console.error('Error fetching cash_donations:', incRes.error);
        if (expRes.error) console.error('Error fetching expenses:', expRes.error);

        const combined = [
          ...(incRes.data || []).map((d: any) => ({ date: d.donation_date, ref: d.receipt_number, person: d.donors?.name || 'Unknown', category: d.income_categories?.name || 'Uncategorized', type: 'Income', amount: Number(d.amount) })),
          ...(expRes.data || []).map((e: any) => ({ date: e.expense_date, ref: 'EXP', person: e.committee_members?.name || e.vendors?.name || 'Unknown', category: e.expense_categories?.name || 'Uncategorized', type: 'Expense', amount: Number(e.amount) }))
        ];
        return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
        
      case 'donation-report': {
        let q = supabaseAdmin.from('cash_donations')
          .select('donation_date, receipt_number, amount, donors(name), income_categories(name), payment_methods(name)')
          .eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
        if (startDate) q = q.gte('donation_date', startDate);
        if (endDate) q = q.lte('donation_date', endDate);
        
        const { data: cashData, error: cashErr } = await q;
        if (cashErr) console.error('Error fetching donation-report:', cashErr);

        return (cashData || []).map((d: any) => ({
          Date: d.donation_date,
          Receipt: d.receipt_number,
          Donor: d.donors?.name || 'Unknown',
          Category: d.income_categories?.name || 'Uncategorized',
          Method: d.payment_methods?.name || 'Unknown',
          Amount: Number(d.amount)
        })).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
      }
      
      case 'expense-report': {
        let q = supabaseAdmin.from('expenses')
          .select('expense_date, description, amount, expense_categories(name), vendors(name), status')
          .eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
        if (startDate) q = q.gte('expense_date', startDate);
        if (endDate) q = q.lte('expense_date', endDate);
        
        const { data: expData, error: expErr } = await q;
        if (expErr) console.error('Error fetching expense-report:', expErr);

        return (expData || []).map((e: any) => ({
          Date: e.expense_date,
          Description: e.description,
          Category: e.expense_categories?.name || 'Uncategorized',
          Vendor: e.vendors?.name || 'N/A',
          Status: e.status,
          Amount: Number(e.amount)
        })).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
      }
      
      case 'vendor-report': {
        let q = supabaseAdmin.from('vendors')
          .select('name, category, phone, address')
          .eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
        
        const { data: vendorData, error: vendorErr } = await q;
        if (vendorErr) console.error('Error fetching vendor-report:', vendorErr);

        return (vendorData || []).map(v => ({
          Name: v.name,
          Category: v.category || 'N/A',
          Phone: v.phone || 'N/A',
          Address: v.address || 'N/A'
        }));
      }

      default:
        return [];
    }
  }

  static async exportPDF(res: any, data: any[], title: string) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename="${title}.pdf"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);
    
    // Custom Headline
    doc.fontSize(24).font('Helvetica-Bold').text('Festival Expense Tracker', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('Developed by Harish', { align: 'center', color: 'gray' });
    doc.moveDown(1);
    
    // About project
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text('A comprehensive financial management system to track and manage festival expenses, donations, and vendor payments efficiently.', { align: 'center' });
    doc.moveDown(2);

    // Report Title
    doc.fontSize(16).font('Helvetica-Bold').fillColor('black').text(title.toUpperCase().replace('-', ' '), { align: 'center' });
    doc.moveDown(1);

    // KPI Boxes (Simulated Flexbox)
    let totalIncome = 0;
    let totalExpense = 0;

    data.forEach(row => {
      const amt = Number(row.amount || row.Amount || 0);
      const type = row.type || row.Type || row.Status || '';
      
      if (title === 'cash-book') {
        if (type === 'Income') totalIncome += amt;
        if (type === 'Expense') totalExpense += amt;
      } else if (title === 'donation-report') {
        totalIncome += amt;
      } else if (title === 'expense-report') {
        totalExpense += amt;
      }
    });

    const currentAmount = totalIncome - totalExpense;

    const boxY = doc.y;
    const boxWidth = 140;
    const boxHeight = 45;
    const spacing = 20;
    const startX = (doc.page.width - (3 * boxWidth + 2 * spacing)) / 2;

    const drawBox = (x: number, y: number, label: string, value: string, color: string) => {
      doc.roundedRect(x, y, boxWidth, boxHeight, 5).lineWidth(1).strokeColor(color).stroke();
      doc.fillColor(color).fontSize(10).font('Helvetica-Bold').text(label, x, y + 10, { width: boxWidth, align: 'center' });
      doc.fillColor('black').fontSize(14).font('Helvetica-Bold').text(value, x, y + 25, { width: boxWidth, align: 'center' });
    };

    drawBox(startX, boxY, 'INCOME', `Rs. ${totalIncome.toLocaleString()}`, '#22C55E');
    drawBox(startX + boxWidth + spacing, boxY, 'EXPENSE', `Rs. ${totalExpense.toLocaleString()}`, '#EF4444');
    drawBox(startX + 2 * (boxWidth + spacing), boxY, 'CURRENT AMOUNT', `Rs. ${currentAmount.toLocaleString()}`, '#3B82F6');

    doc.y = boxY + boxHeight + 30;
    doc.fillColor('black');
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]).map(k => k.toUpperCase());
      const rows = data.map(row => Object.values(row).map(val => String(val)));
      
      const tableWidth = 500;
      const startX = (doc.page.width - tableWidth) / 2;
      const startY = doc.y;
      const numCols = headers.length;
      const colWidth = tableWidth / numCols;

      const table = {
        headers: headers.map(h => ({ 
          label: h, 
          width: colWidth,
          valign: 'center'
        })),
        rows
      };

      await doc.table(table, {
        width: tableWidth,
        x: startX,
        padding: [8, 5, 8, 5],
        divider: {
          header: { disabled: false, width: 1, opacity: 1, color: 'black' },
          horizontal: { disabled: false, width: 1, opacity: 1, color: 'black' },
          vertical: { disabled: false, width: 1, opacity: 1, color: 'black' }
        },
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        addPage: true,
        prepareRow: (row?: any, indexColumn?: number, indexRow?: number, rectRow?: any) => {
          doc.font('Helvetica').fontSize(10);
        }
      });
      
    } else {
      doc.fontSize(12).text('No data available.', { align: 'center' });
    }
    
    doc.end();
  }

  static async exportExcel(res: any, data: any[], title: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title.toUpperCase().replace('-', ' '));
    
    if (data.length > 0) {
      sheet.columns = Object.keys(data[0]).map(k => ({ header: k.toUpperCase(), key: k, width: 20 }));
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      data.forEach(row => sheet.addRow(row));
    }
    
    res.setHeader('Content-disposition', `attachment; filename="${title}.xlsx"`);
    res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  }

  static async exportCSV(res: any, data: any[], title: string) {
    if (data.length === 0) return res.send('No data');
    const csvStringifier = createObjectCsvStringifier({
      header: Object.keys(data[0]).map(k => ({ id: k, title: k.toUpperCase() }))
    });
    
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);
    res.setHeader('Content-disposition', `attachment; filename="${title}.csv"`);
    res.setHeader('Content-type', 'text/csv');
    res.send(csvContent);
  }
}
