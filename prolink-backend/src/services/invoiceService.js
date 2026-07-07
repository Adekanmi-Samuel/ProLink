const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate a PDF invoice
const generateInvoicePDF = (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fillColor('#10B981').fontSize(24).text('ProLink Invoice', { align: 'right' });
      doc.fillColor('#444444').fontSize(10).text(`Invoice #: ${invoiceData.id}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Client Info
      doc.fontSize(14).text('Billed To:');
      doc.fontSize(10).text(invoiceData.clientName);
      doc.text(invoiceData.clientEmail);
      if (invoiceData.clientCAC) {
        doc.text(`CAC: ${invoiceData.clientCAC}`);
      }
      doc.moveDown();

      // Provider Info
      doc.fontSize(14).text('Service Provider:');
      doc.fontSize(10).text(invoiceData.providerName);
      doc.text(invoiceData.providerEmail);
      if (invoiceData.providerCAC) {
        doc.text(`CAC: ${invoiceData.providerCAC}`);
      }
      doc.moveDown(2);

      // Table Header
      const tableTop = 330;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount', 400, tableTop, { width: 90, align: 'right' });
      
      const hrY = tableTop + 15;
      doc.moveTo(50, hrY).lineTo(500, hrY).stroke();

      // Row
      doc.font('Helvetica');
      doc.text(invoiceData.jobTitle, 50, hrY + 10);
      doc.text(`NGN ${invoiceData.amount.toLocaleString()}`, 400, hrY + 10, { width: 90, align: 'right' });

      // Fees
      if (invoiceData.feeAmount) {
        doc.text(`Platform Fee`, 50, hrY + 30);
        doc.text(`- NGN ${invoiceData.feeAmount.toLocaleString()}`, 400, hrY + 30, { width: 90, align: 'right' });
      }

      // Total
      const hrY2 = hrY + 55;
      doc.moveTo(50, hrY2).lineTo(500, hrY2).stroke();
      doc.font('Helvetica-Bold');
      doc.text('Net Total', 250, hrY2 + 10, { align: 'right' });
      doc.text(`NGN ${(invoiceData.amount - (invoiceData.feeAmount || 0)).toLocaleString()}`, 400, hrY2 + 10, { width: 90, align: 'right' });

      // Footer
      doc.moveDown(4);
      doc.fontSize(10).text('Thank you for using ProLink. This is a system-generated receipt.', 50, 700, { align: 'center', width: 400 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
