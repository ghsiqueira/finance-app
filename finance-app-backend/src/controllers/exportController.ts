import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const exportToCSV = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate, type, categoryId } = req.query;

    const query: any = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    const transactions = await Transaction.find(query)
      .populate('categoryId')
      .sort({ date: -1 });

    const BOM = '\uFEFF';
    let csv = BOM + 'Data,Descrição,Categoria,Tipo,Valor,Recorrente\n';

    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('pt-BR');
      const description = `"${transaction.description.replace(/"/g, '""')}"`;
      const category = transaction.categoryId 
        ? `"${(transaction.categoryId as any).name}"` 
        : 'Sem Categoria';
      const type = transaction.type === 'income' ? 'Receita' : 'Despesa';
      const amount = transaction.amount.toFixed(2).replace('.', ',');
      const recurring = transaction.isRecurring ? 'Sim' : 'Não';

      csv += `${date},${description},${category},${type},${amount},${recurring}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=transacoes.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const exportToExcel = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate, type, categoryId } = req.query;

    const query: any = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    const transactions = await Transaction.find(query)
      .populate('categoryId')
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transações');

    worksheet.columns = [
      { header: 'Data', key: 'date', width: 12 },
      { header: 'Descrição', key: 'description', width: 30 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Valor', key: 'amount', width: 15 },
      { header: 'Recorrente', key: 'recurring', width: 12 },
    ];

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90E2' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      const row = worksheet.addRow({
        date: new Date(transaction.date).toLocaleDateString('pt-BR'),
        description: transaction.description,
        category: transaction.categoryId ? (transaction.categoryId as any).name : 'Sem Categoria',
        type: transaction.type === 'income' ? 'Receita' : 'Despesa',
        amount: transaction.amount,
        recurring: transaction.isRecurring ? 'Sim' : 'Não',
      });

      if (transaction.type === 'income') {
        row.getCell('amount').font = { color: { argb: 'FF34C759' }, bold: true };
        totalIncome += transaction.amount;
      } else {
        row.getCell('amount').font = { color: { argb: 'FFFF3B30' }, bold: true };
        totalExpense += transaction.amount;
      }

      row.getCell('amount').numFmt = 'R$ #,##0.00';
    });

    worksheet.addRow([]);
    const totalRow = worksheet.addRow({
      date: '',
      description: '',
      category: '',
      type: 'TOTAIS',
      amount: '',
      recurring: '',
    });
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };

    worksheet.addRow({
      date: '',
      description: '',
      category: '',
      type: 'Receitas',
      amount: totalIncome,
      recurring: '',
    });
    worksheet.getCell(`E${worksheet.lastRow!.number}`).font = { color: { argb: 'FF34C759' }, bold: true };
    worksheet.getCell(`E${worksheet.lastRow!.number}`).numFmt = 'R$ #,##0.00';

    worksheet.addRow({
      date: '',
      description: '',
      category: '',
      type: 'Despesas',
      amount: totalExpense,
      recurring: '',
    });
    worksheet.getCell(`E${worksheet.lastRow!.number}`).font = { color: { argb: 'FFFF3B30' }, bold: true };
    worksheet.getCell(`E${worksheet.lastRow!.number}`).numFmt = 'R$ #,##0.00';

    const balance = totalIncome - totalExpense;
    worksheet.addRow({
      date: '',
      description: '',
      category: '',
      type: 'Saldo',
      amount: balance,
      recurring: '',
    });
    worksheet.getCell(`E${worksheet.lastRow!.number}`).font = { 
      color: { argb: balance >= 0 ? 'FF34C759' : 'FFFF3B30' }, 
      bold: true 
    };
    worksheet.getCell(`E${worksheet.lastRow!.number}`).numFmt = 'R$ #,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transacoes.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const exportToPDF = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate, type, categoryId } = req.query;

    const query: any = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    const transactions = await Transaction.find(query)
      .populate('categoryId')
      .sort({ date: -1 });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=transacoes.pdf');
      res.send(pdfBuffer);
    });

    doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Transações', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    doc.fontSize(12).font('Helvetica-Bold').text('Resumo:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de Transações: ${transactions.length}`);
    doc.text(`Receitas: R$ ${totalIncome.toFixed(2).replace('.', ',')}`);
    doc.text(`Despesas: R$ ${totalExpense.toFixed(2).replace('.', ',')}`);
    doc.text(`Saldo: R$ ${balance.toFixed(2).replace('.', ',')}`);
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica-Bold').text('Transações:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemsPerPage = 25;
    let currentItem = 0;

    transactions.forEach((transaction, i) => {
      if (currentItem >= itemsPerPage) {
        doc.addPage();
        currentItem = 0;
      }

      const y = tableTop + (currentItem * 20);
      
      doc.fontSize(9).font('Helvetica');
      doc.text(new Date(transaction.date).toLocaleDateString('pt-BR'), 50, y, { width: 70 });
      doc.text(transaction.description.substring(0, 30), 130, y, { width: 150 });
      doc.text(transaction.categoryId ? (transaction.categoryId as any).name : 'Sem Categoria', 290, y, { width: 100 });
      doc.text(
        `R$ ${transaction.amount.toFixed(2).replace('.', ',')}`,
        400,
        y,
        { width: 100, align: 'right' }
      );

      currentItem++;
    });

    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Server error' });
  }
};