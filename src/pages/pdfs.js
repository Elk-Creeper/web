// pdfUtils.js
import jsPDF from "jspdf";

export const centerText = (pdf, text, y) => {
  const textWidth =
    (pdf.getStringUnitWidth(text) * pdf.internal.getFontSize()) /
    pdf.internal.scaleFactor;
  const x = (pdf.internal.pageSize.width - textWidth) / 2;
  pdf.text(text, x, y);
};

export const generateMarriageCertificateForm = () => {
  const pdfDoc = new jsPDF();

  // Set the page border with specified width, color, and margin
  const formBorderWidth = 0.5;
  const borderColor = "#FF0000";
  const margin = 15.5;

  pdfDoc.setDrawColor(borderColor);
  pdfDoc.setLineWidth(formBorderWidth);

  pdfDoc.rect(
    margin,
    margin,
    pdfDoc.internal.pageSize.width - 2 * margin,
    pdfDoc.internal.pageSize.height - 2 * margin
  );

  // Customize the form design
  pdfDoc.setFontSize(7);
  pdfDoc.text("Municipal Form No. 97", 17, 20);
  pdfDoc.text("(To be accomplished in quadruplicate using black ink)", 135, 20);
  pdfDoc.text("(Revised August 2016)", 17, 23);

  pdfDoc.setFontSize(10);
  centerText(pdfDoc, "Republic of the Philippines", 22);
  centerText(pdfDoc, "OFFICE OF THE CIVIL REGISTRAR GENERAL", 26);

  pdfDoc.setFontSize(17);
  pdfDoc.setFont("bolder");
  centerText(pdfDoc, "CERTIFICATE OF MARRIAGE", 31);
  pdfDoc.setFont("normal");

  // Draw thin border line below the certificate text
  const lineWidth = pdfDoc.internal.pageSize.width - 2 * margin;
  const lineHeight = 0.1; // Thin border size
  pdfDoc.setLineWidth(lineHeight);
  pdfDoc.rect(margin, 22 + 10, lineWidth, lineHeight);

// Add form fields with data in two columns
const column1X = 17;
const column1WidthPercentage = 75; // Adjust the width percentage of the first column (Province)
const column1Width = (lineWidth / 2 - 10) * (column1WidthPercentage / 100);
const column2X = column1X + column1Width + 10; // Adjust the gap between columns
const column2Width = lineWidth - column1Width - 20; // Adjust the width of the second column (Registry No.)
const startY = 38;
const lineHeightText = 6; // Line height for text

pdfDoc.setFontSize(11);
pdfDoc.text("Province", column1X, startY, { maxWidth: column1Width });
pdfDoc.text("City/Municipality", column1X, startY + lineHeightText);
pdfDoc.text("Registry No.", column2X, 38, { maxWidth: column2Width });

// Draw lines after "Province" and "City/Municipality"
const lineY = startY + lineHeightText * 2;
pdfDoc.setLineWidth(0.2); // Adjust the line thickness
pdfDoc.line(column1X, lineY, column1X + column1Width, lineY);
pdfDoc.line(
  column1X,
  lineY + lineHeightText,
  column1X + column1Width,
  lineY + lineHeightText
);

// Draw border between columns
pdfDoc.rect(column1X, startY, column1Width, lineHeightText * 2);

// Draw border below
const borderY = startY + lineHeightText * 2;
pdfDoc.rect(margin, borderY, lineWidth, lineHeight);

  // Save the PDF or open in a new window
  pdfDoc.save("MarriageCertificateForm.pdf");
};
