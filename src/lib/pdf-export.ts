async function getJSPDF() {
  if (typeof window !== "undefined") {
    const jsPDFModule = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");
    const htmlToImageModule = await import("html-to-image");
    return {
      jsPDF: jsPDFModule.default,
      autoTable: autoTableModule.default,
      toPng: htmlToImageModule.toPng,
    };
  }
  return null;
}

export async function generatePdfReport({
  adSummary,
  userSummary,
}: {
  adSummary: any;
  userSummary: any;
}) {
  try {
    toast.info("Generating PDF report...", { description: "Capturing charts and data..." });

    const pdfModules = await getJSPDF();
    if (!pdfModules) return;
    const { jsPDF, autoTable, toPng } = pdfModules;

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // -- PAGE 1: Summary --
    doc.setFontSize(22);
    doc.setTextColor(13, 92, 99); // Teal
    doc.text("Analytics & Reports", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Overview Summary", 14, 40);

    const summaryData = [
      ["Metric", "Value"],
      ["Total Ads", `${adSummary?.totalAds?.toLocaleString() || 0}`],
      ["Approved Ads", `${adSummary?.approvedAds?.toLocaleString() || 0}`],
      ["Pending Ads", `${adSummary?.pendingAds?.toLocaleString() || 0}`],
      ["Draft Ads", `${adSummary?.draftAds?.toLocaleString() || 0}`],
      ["Total Users", `${userSummary?.totalUsers?.toLocaleString() || 0}`],
      ["Total Agents", `${userSummary?.totalAgents?.toLocaleString() || 0}`],
      ["Total Organizations", `${userSummary?.totalOrganizations?.toLocaleString() || 0}`],
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 45,
      theme: "grid",
      headStyles: { fillColor: [13, 92, 99] },
      styles: { fontSize: 10 },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // Helper to add image to PDF
    const addImageToPdf = async (elementId: string, title: string) => {
      const element = document.getElementById(elementId);
      if (!element) return;

      if (finalY > pageHeight - 60) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(title, 14, finalY);
      finalY += 7;

      try {
        const dataUrl = await toPng(element, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          style: {
            background: "white",
          },
        });

        const imgProps = doc.getImageProperties(dataUrl);
        const pdfWidth = pageWidth - 28;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (finalY + pdfHeight > pageHeight - 10) {
          if (finalY >= 40) {
            doc.addPage();
            finalY = 20;
          }
        }

        doc.addImage(dataUrl, "PNG", 14, finalY, pdfWidth, pdfHeight);
        finalY += pdfHeight + 10;
      } catch (err) {
        console.error(`Failed to capture ${title}:`, err);
      }
    };

    await addImageToPdf("report-creation-chart", "Ad Creation Trends");
    await addImageToPdf("report-entity-split", "Creation by User / Org");
    await addImageToPdf("report-advanced-charts", "Advanced Ad Details");

    doc.save("analytics-report.pdf");
    toast.success("PDF generated successfully");
  } catch (error) {
    console.error("PDF Gen Error:", error);
    toast.error("Failed to generate PDF");
  }
}
