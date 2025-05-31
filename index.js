const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.post("/generate-pdf", async (req, res) => {
  const { html, filename = "document.pdf" } = req.body;

  if (!html) {
    return res.status(400).json({ error: "Missing HTML in request body" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();

    // Set timeout to 60 seconds to allow slower pages
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // print backgrounds for better PDF output
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Failed to close browser:", closeError);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
