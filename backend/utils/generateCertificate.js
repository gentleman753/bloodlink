import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generateDonationCertificate = (donation, donor, bloodBank) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Blood Donation Certificate', { align: 'center' })
        .moveDown(2);

      // Certificate body
      doc
        .fontSize(14)
        .font('Helvetica')
        .text('This is to certify that', { align: 'center' })
        .moveDown(1);

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(donor.profile.name, { align: 'center' })
        .moveDown(1);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('has voluntarily donated blood on', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(
          new Date(donation.donationDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          { align: 'center' }
        )
        .moveDown(1);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Blood Group:', { continued: true })
        .font('Helvetica-Bold')
        .text(` ${donation.bloodGroup}`)
        .moveDown(1);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Donated at:', { continued: true })
        .font('Helvetica-Bold')
        .text(` ${bloodBank.profile.name}`)
        .moveDown(2);

      // Footer
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('This certificate is issued in recognition of the noble act of blood donation.', {
          align: 'center',
        })
        .moveDown(2);

      // Signature line
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Authorized Signatory', { align: 'right' })
        .moveDown(0.5)
        .text(bloodBank.profile.name, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

