import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

function formatSectionLabels(sectionArray = []) {
  const labelMap = {
    preExpander: "EPS/THERMOCOL BLOCK MOULDING",
    shapeMoulding: "EPS/THERMOCOL SHAPE MOULDING",
  };
  return sectionArray.map((s) => labelMap[s] || s.toUpperCase()).join(", ");
}

export async function generateCuttingSlipPDF(order, rows = [], filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const logoPath = path.join("utils", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width - 100, 30, { width: 60 });
    }

    const sections = order.sentTo?.dispatch || order.sentTo?.production || [];
    doc.fontSize(16).font("Helvetica-Bold").text(
      "EPS / THERMOCOL SHEET CUTTING ORDER SLIP",
      { align: "center" }
    );
    doc.moveDown().fontSize(12).font("Helvetica");

    doc.text("ORDER No: ", { continued: true })
      .font("Helvetica-Bold")
      .text(order.shortId || "..................")
      .font("Helvetica");
    doc.text("Customer Nick Name: ", { continued: true })
      .font("Helvetica-Bold")
      .text((order.customerName || "..................").toUpperCase())
      .font("Helvetica");
    doc.text("Date: ", { continued: true })
      .font("Helvetica-Bold")
      .text(new Date(order.createdAt).toLocaleDateString().toUpperCase())
      .font("Helvetica");
    doc.moveDown();
    doc.text("To. Sheets Cutting Supervisor: __Sunny__");
    doc.moveDown();

    if (sections.length) {
      doc.text("Sections: ", { continued: true })
        .font("Helvetica-Bold")
        .text(formatSectionLabels(sections))
        .font("Helvetica");
      doc.moveDown();
    }

    const startX = 40;
    let y = doc.y + 10;

    const colWidths = [30, 170, 110, 110, 140];
    const headers = [
      "Sr. No.",
      "Size of Thermocol Packet/Sheet\n(Length x Width x Thickness OR Pipe Size x Thickness)",
      "Quantity (Packets / Pcs / Mtrs)",
      "Density (Kg/m³ or ND/LD/FR)",
      "Remarks (e.g., Packing type, weight check, etc.)",
    ];

    doc.font("Helvetica-Bold").fontSize(9);
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, y, colWidths[i], 40).stroke();
      doc.text(header, x + 3, y + 3, {
        width: colWidths[i] - 6,
        align: "left",
        lineBreak: true,
      });
    });

    y += 40;
    doc.font("Helvetica").fontSize(9);

    rows.forEach((dataRow, index) => {
      const row = [
        (index + 1).toString(),
        dataRow.size || "",
        dataRow.quantity || "",
        dataRow.density || "",
        dataRow.remarks || "",
      ];

      const rowHeights = row.map((cell, j) =>
        doc.heightOfString(cell, { width: colWidths[j] - 6 }) + 8
      );
      const rowHeight = Math.max(...rowHeights, 30);

      if (y + rowHeight > doc.page.height - 100) {
        doc.addPage();
        y = 40;
      }

      row.forEach((cell, j) => {
        const x = startX + colWidths.slice(0, j).reduce((a, b) => a + b, 0);
        doc.rect(x, y, colWidths[j], rowHeight).stroke();
        doc.text(String(cell), x + 3, y + 5, {
          width: colWidths[j] - 6,
          height: rowHeight - 6,
          align: "center",
          lineBreak: false,
        });
      });

      y += rowHeight;
    });

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}


export async function generateShapeSlipPDF(order, rows = [], filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const logoPath = path.join("utils", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width - 100, 30, { width: 60 });
    }

    doc.fontSize(16).font("Helvetica-Bold").text(
      "EPS / THERMOCOL SHAPE MOULDING DIE MADE ORDER SLIP",
      { align: "center" }
    );
    doc.moveDown().fontSize(12).font("Helvetica");

    doc.text("ORDER No: ", { continued: true })
      .font("Helvetica-Bold")
      .text(order.shortId || "..................")
      .font("Helvetica");
    doc.text("Customer Nick Name: ", { continued: true })
      .font("Helvetica-Bold")
      .text((order.customerName || "..................").toUpperCase())
      .font("Helvetica");
    doc.text("Date: ", { continued: true })
      .font("Helvetica-Bold")
      .text(new Date(order.createdAt).toLocaleDateString().toUpperCase())
      .font("Helvetica");
    doc.moveDown();
    doc.text("To. Plant Foreman/Production Supervisor: __Santosh Mandal__");
    doc.moveDown();

    if (order.sentTo?.production?.length) {
      doc.text("Sections: ", { continued: true })
        .font("Helvetica-Bold")
        .text(formatSectionLabels(order.sentTo.production))
        .font("Helvetica");
      doc.moveDown();
    }

    const startX = 40;
    let y = doc.y + 10;

    const colWidths = [30, 150, 130, 90, 150];
    const headers = [
      "Sr. No.",
      "Product Name (As per Google Drive, attach photo if needed)",
      "DRY Weight to be maintained (Density in Kg/m3 and Raw material grade name)",
      "Quantity\n(No. of Pcs to be made)",
      "Remarks (special instructions, packaging, mould name/number, material ready date)",
    ];

    doc.font("Helvetica-Bold").fontSize(9);
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, y, colWidths[i], 40).stroke();
      doc.text(header, x + 3, y + 3, { width: colWidths[i] - 6 });
    });

    y += 40;
    doc.font("Helvetica").fontSize(10);

    rows.forEach((dataRow, index) => {
      const row = [
        (index + 1).toString(),
        (dataRow.productName || "").toUpperCase(),
        (dataRow.dryWeight || "").toUpperCase(),
        (dataRow.quantity || ""),
        (dataRow.remarks || "").toUpperCase(),
      ];

      const rowHeights = row.map((cell, j) =>
        Math.max(30, doc.heightOfString(cell, { width: colWidths[j] - 6 }) + 10)
      );
      const cellHeight = Math.max(...rowHeights);

      row.forEach((cell, j) => {
        const x = startX + colWidths.slice(0, j).reduce((a, b) => a + b, 0);
        doc.rect(x, y, colWidths[j], cellHeight).stroke();
        doc.text(cell, x + 3, y + 5, { width: colWidths[j] - 6 });
      });

      y += cellHeight;
    });

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}


export async function generatePackagingSlipPDF(order, rows = [], filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const logoPath = path.join("utils", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width - 100, 30, { width: 60 });
    }

    const startX = 40;
    let y = 50;

    doc.fontSize(16)
      .font("Helvetica-Bold")
      .text("EPS / THERMOCOL SHAPE MOULDING MATERIAL PACKAGING SLIP", {
        align: "center",
      });

    y = doc.y + 10;
    doc.fontSize(12).font("Helvetica").text(
      "Plant Foreman/Production Supervisor: ___Mandeep___",
      startX,
      y
    );

    y = doc.y + 10;

    // Order Info
    doc.moveDown().fontSize(12).font("Helvetica");
    doc.text("ORDER No: ", { continued: true })
      .font("Helvetica-Bold")
      .text(order.shortId || "..................")
      .font("Helvetica");

    doc.text("Client Name: ", { continued: true })
      .font("Helvetica-Bold")
      .text((order.customerName || "..................").toUpperCase())
      .font("Helvetica");

    doc.text("Product: ", { continued: true })
      .font("Helvetica-Bold")
      .text(order.product || "..................")
      .font("Helvetica");

    doc.text("Date: ", { continued: true })
      .font("Helvetica-Bold")
      .text(new Date(order.createdAt).toLocaleDateString().toUpperCase())
      .font("Helvetica");

    doc.moveDown(0.5);
    y = doc.y + 20;

    // Table headers
    const colWidths = [30, 200, 100, 150];
    const headers = [
      "Sr. No.",
      "Product Name",
      "Quantity(No. of pcs to be Dispatch)",
      "Remarks (e.g., fragile, stacking, etc.)",
    ];

    doc.font("Helvetica-Bold").fontSize(9);
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, y, colWidths[i], 40).stroke();
      doc.text(header, x + 3, y + 3, {
        width: colWidths[i] - 6,
        align: "left",
      });
    });

    y += 40;
    doc.font("Helvetica").fontSize(10);

    rows.forEach((dataRow, index) => {
      const row = [
        (index + 1).toString(),
        dataRow.product || order.product,
        dataRow.quantity || "",
        dataRow.remarks || "",
      ];

      const rowHeights = row.map((cell, j) =>
        Math.max(30, doc.heightOfString(cell, { width: colWidths[j] - 6 }) + 10)
      );
      const rowHeight = Math.max(...rowHeights);

      row.forEach((cell, j) => {
        const x = startX + colWidths.slice(0, j).reduce((a, b) => a + b, 0);
        doc.rect(x, y, colWidths[j], rowHeight).stroke();
        doc.text(cell, x + 3, y + 5, {
          width: colWidths[j] - 6,
          align: "left",
        });
      });

      y += rowHeight;
    });

    // Footer
    const totalLabelWidth = colWidths[0] + colWidths[1];
    const totalValueWidth = colWidths[2] + colWidths[3];

    doc.rect(startX, y, totalLabelWidth, 25).stroke();
    doc.rect(startX + totalLabelWidth, y, totalValueWidth, 25).stroke();

    doc.end();

    // Finish stream safely
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

//
export const generateDanaSlipPDF = (order, rows, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 30 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    const startX = 30;
    let y = 30;

    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.font("Helvetica-Bold").fontSize(12).text(
      "EPS/THERMOCOL RAW BLOCK / THERMOCOL DANA ORDER SLIP",
      { align: "center" }
    );
    y += 25;

    doc.font("Helvetica").fontSize(10);
    doc.text(`Order No: ${order.shortId || ""}`, startX, y);
    y += 15;

    const customerName = (order.customerName || "..................").toUpperCase();
    doc.font("Helvetica-Bold").text("Customer Nick Name: ", startX, y, { continued: true });
    doc.font("Helvetica").text(customerName);

    const dateStr = `Date: ${new Date(order.createdAt).toLocaleDateString().toUpperCase()}`;
    const dateWidth = doc.widthOfString(dateStr, { font: "Helvetica-Bold", size: 10 });
    doc.font("Helvetica-Bold").text(dateStr, startX + usableWidth - dateWidth, y - 15);

    y += 20;
    doc.font("Helvetica").text("Block Operator/Supervisor:__Sandeep__", startX, y);
    y += 20;

    const colRatios = [0.06, 0.21, 0.26, 0.15, 0.32];
    const colWidths = colRatios.map(r => r * usableWidth);

    const headers = [
      "S.No.",
      "Type of Raw Block ...",
      "Density in Kg/m3 and Weight to be maintained ...",
      "Quantity (No of Blocks) ...",
      "Remarks (Any special instructions ...) ",
    ];

    doc.font("Helvetica-Bold").fontSize(6);
    let x = startX;
    const headerHeight = 70;

    headers.forEach((text, i) => {
      doc.rect(x, y, colWidths[i], headerHeight).stroke();
      doc.text(text, x + 2, y + 2, {
        width: colWidths[i] - 4,
        align: "left",
      });
      x += colWidths[i];
    });

    y += headerHeight;

    const dataRows = Array.isArray(rows) ? rows : [rows];
    doc.font("Helvetica").fontSize(8.5);

    dataRows.forEach((row, i) => {
      const cells = [
        (i + 1).toString(),
        row.productName || "",
        row.rawMaterial || "",
        row.quantity || "",
        row.remarks || "",
      ];
console.log("📄 Dana Row in PDF:", row);

      const rowHeights = cells.map((text, j) =>
        doc.heightOfString(text, {
          width: colWidths[j] - 6,
          align: "left",
        })
      );
      const rowHeight = Math.max(...rowHeights) + 10;

      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;

        // Redraw headers
        x = startX;
        doc.font("Helvetica-Bold").fontSize(6);
        headers.forEach((text, i) => {
          doc.rect(x, y, colWidths[i], headerHeight).stroke();
          doc.text(text, x + 2, y + 2, {
            width: colWidths[i] - 4,
            align: "left",
          });
          x += colWidths[i];
        });
        y += headerHeight;
      }

      x = startX;
      cells.forEach((text, j) => {
        doc.rect(x, y, colWidths[j], rowHeight).stroke();
        doc.text(text, x + 3, y + 5, {
          width: colWidths[j] - 6,
          align: "left",
        });
        x += colWidths[j];
      });

      y += rowHeight;
    });

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};


