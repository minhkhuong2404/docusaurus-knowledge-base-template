// Copy and paste this code into your Google Sheet:
// Extensions -> Apps Script -> Paste code -> Click Deploy -> New deployment -> Web app (Access: Anyone)

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    for (var tabName in data) {
      var rows = data[tabName];
      if (!rows || rows.length === 0) continue;
      
      var sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        sheet = ss.insertSheet(tabName);
      }
      
      // Clear existing content & replace with new rows
      sheet.clearContents();
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Successfully updated sheets!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
