const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" })); // for JSON payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // for form submissions

app.post("/generate-pdf", async (req, res) => {
  const { html, filename = "document.pdf" } = req.body;

  if (!html) {
    return res.status(400).json({ error: "Missing HTML in request body" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
