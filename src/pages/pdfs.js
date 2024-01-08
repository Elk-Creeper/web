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

  pdfDoc.setFontSize(9);
  centerText(pdfDoc, "Republic of the Philippines", 22);
  centerText(pdfDoc, "OFFICE OF THE CIVIL REGISTRAR GENERAL", 26);

  pdfDoc.setFontSize(17);
  pdfDoc.setFont("bold");
  centerText(pdfDoc, "CERTIFICATE OF MARRIAGE", 31);
  pdfDoc.setFont("normal");

  // Draw thin border line below the certificate text
  const lineWidth = pdfDoc.internal.pageSize.width - 2 * margin;
  const lineHeight = 0.08; // Thin border size
  pdfDoc.setLineWidth(lineHeight);
  pdfDoc.rect(margin, 22 + 10, lineWidth, lineHeight);

  // Add form fields with data in two columns
  const column1X = 17;
  const startY = 38;
  const lineHeightText = 7; // Line height for text

  pdfDoc.setFontSize(11);

  // Draw a line after the word "Province" (manually adjust both ends)
  pdfDoc.line(33, startY, 126, startY);

  pdfDoc.text("Province", column1X, startY);

  // Draw a line after the word "City/Municipality" (manually adjust both ends)
  const line2X = column1X + 95 + 20; // Adjust the length of the line manually
  pdfDoc.line(45, startY + lineHeightText, line2X - 5, startY + lineHeightText);

  pdfDoc.text("City/Municipality", column1X, startY + lineHeightText);

  // Draw thin border line below
  const lineWidths = pdfDoc.internal.pageSize.width - 2 * margin;
  const lineHeights = 0.3; // Thin border size
  pdfDoc.setLineWidth(lineHeights);
  pdfDoc.rect(margin, 37 + 10, lineWidths, lineHeights);

  // Draw vertical border line before the "Registry No." part (thinner and shorter)
  const thinnerLineWidth = 0.2; // Adjust the thickness of the vertical line
  const shorterLineHeight = 15; // Adjust the length of the vertical line
  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(130, 32, 130, 32 + shorterLineHeight);

  pdfDoc.text("Registry No.", 133, 38);

  // Draw a vertical line before "Name of Contracting Parties" text
  const verticalLineX = 50;
  const verticalLineHeight = 150; // Adjust the length of the vertical line
  pdfDoc.setLineWidth(thinnerLineWidth);
  pdfDoc.line(verticalLineX, 47, verticalLineX, 47 + verticalLineHeight);

  // Add text "1. Name of Contracting Parties"
  pdfDoc.setFont("normal");
  pdfDoc.setFontSize(9);

  // Define the width of the text box to fit within the vertical line
  const textBoxWidth = verticalLineX - column1X - 5; // Adjust as needed

  // Split the text into multiple lines if it exceeds the width
  const text = "1. Name of Contracting Parties";
  const splitText = pdfDoc.splitTextToSize(text, textBoxWidth);

  // Draw each line of the text
  for (let i = 0; i < splitText.length; i++) {
    pdfDoc.text(splitText[i], column1X + 5, 54 + 3 + i * 5); // Adjust the vertical spacing as needed
  }

  pdfDoc.setFontSize(11);
  pdfDoc.setFont("bold");
  pdfDoc.text("HUSBAND", 77, 51);
  pdfDoc.setFont("normal");

  // Draw a vertical line before "Name of Contracting Parties" text
  const verticalLine = 123;
  const verticalHeight = 150; // Adjust the length of the vertical line
  pdfDoc.setLineWidth(formBorderWidth);
  pdfDoc.line(verticalLine, 47, verticalLine, 47 + verticalHeight);

  // Draw thin border line below the certificate text
  const horizontalWidths = pdfDoc.internal.pageSize.width - 2 * margin;
  const horizontalHeight = 0.07; // Thin border size
  pdfDoc.setLineWidth(horizontalHeight);
  pdfDoc.rect(50, 52, 144, horizontalHeight);

  pdfDoc.setFontSize(11);
  pdfDoc.setFont("bold");
  pdfDoc.text("WIFE", 153, 51);
  pdfDoc.setFont("normal");

  // Set text color to red
  pdfDoc.setTextColor("#FF0000");

  // First
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(First)", 51, 57);

  // First
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(First)", 124, 57);

  // Middle
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Middle)", 51, 62);

  // Middle
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Middle)", 124, 62);

  // Last
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Last)", 51, 67);

  // Last
  pdfDoc.setFontSize(8);
  pdfDoc.setFont("normal");
  pdfDoc.text("(Last)", 124, 67);

  // Reset text color to black (optional, if you want to set it back to default)
  pdfDoc.setTextColor("#000000");

  

  // Save the PDF or open in a new window
  pdfDoc.save("MarriageCertificateForm.pdf");
};
