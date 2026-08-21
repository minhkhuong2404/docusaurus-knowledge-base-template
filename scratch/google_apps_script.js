// Copy and paste this code into your Google Sheet:
// Extensions -> Apps Script -> Paste code -> Click Deploy -> New deployment / Manage Deployments -> Web app (Access: Anyone)

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {};
    var sheets = ss.getSheets();
    
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var name = sheet.getName();
      if (name === "test") continue;
      
      var data = sheet.getDataRange().getValues();
      result[name] = data;
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

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
      var lastRow = sheet.getLastRow();
      
      if (lastRow === 0) {
        // If sheet is empty, write header + rows
        sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      } else {
        // Sheet has existing data - ONLY APPEND new rows
        var existingData = sheet.getDataRange().getValues();
        var existingIds = {};
        for (var i = 1; i < existingData.length; i++) {
          var idVal = String(existingData[i][0] || "").trim();
          if (idVal) existingIds[idVal] = true;
        }
        
        var rowsToAppend = [];
        for (var r = 0; r < rows.length; r++) {
          var row = rows[r];
          var idVal = String(row[0] || "").trim();
          if (idVal.toLowerCase() === "id") continue; // Skip header row
          if (idVal && existingIds[idVal]) continue; // Skip already existing IDs
          rowsToAppend.push(row);
        }
        
        if (rowsToAppend.length > 0) {
          sheet.getRange(lastRow + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Successfully appended new questions to sheets!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
