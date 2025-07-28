// Thêm vào cuối file

// Export browsers
document
  .getElementById("exportBrowsers")
  .addEventListener("click", async () => {
    try {
      const response = await fetch("/admin/browsers/export");
      const browsers = await response.json();
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(browsers));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "browsers_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error("Error exporting browsers:", error);
      alert("Error exporting browsers");
    }
  });

// Import browsers
document.getElementById("importBrowsers").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document
  .getElementById("importFile")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const browsers = JSON.parse(e.target.result);
          const response = await fetch("/admin/browsers/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(browsers),
          });
          const result = await response.json();
          if (result.success) {
            alert("Browsers imported successfully");
            location.reload(); // Tải lại trang để hiển thị danh sách trình duyệt mới
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          console.error("Error importing browsers:", error);
          alert("Error importing browsers");
        }
      };
      reader.readAsText(file);
    }
  });
