// Google Apps Script — BumpMatch Email Sender
// Deploy this as a Web App (Execute as: Me, Access: Anyone)

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type; // "welcome", "reset", or "custom"
    var to = data.to;
    var firstName = data.firstName || "";

    if (!to) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Missing 'to' field" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var subject = "";
    var htmlBody = "";

    if (type === "welcome") {
      var inviteCode = data.inviteCode || "";
      subject = "Welcome to BumpMatch!";
      htmlBody =
        '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">' +
        '<h2 style="color: #333; margin-bottom: 8px;">Welcome to BumpMatch!</h2>' +
        '<p style="color: #666; font-size: 16px;">Hey ' + firstName + ',</p>' +
        '<p style="color: #666; font-size: 16px;">Welcome to BumpMatch! We\'re so excited to help you find the perfect baby name.</p>' +
        '<p style="color: #666; font-size: 16px;">Is anyone else walking this journey with you? Invite your partner to swipe together and discover names you both love!</p>' +
        '<div style="background: #F0F9FF; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">' +
        '<p style="color: #0369A1; font-size: 14px; margin: 0 0 8px 0;">Your partner invite code:</p>' +
        '<span style="font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #0C4A6E;">' + inviteCode + '</span>' +
        '</div>' +
        '<p style="color: #666; font-size: 14px;">Share this code with your partner so they can join you on BumpMatch. Happy swiping!</p>' +
        '<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />' +
        '<p style="color: #999; font-size: 12px;">BumpMatch - Find the perfect baby name together.</p>' +
        '</div>';

    } else if (type === "reset") {
      var resetToken = data.resetToken || "";
      subject = "Your BumpMatch Password Reset Code";
      htmlBody =
        '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">' +
        '<h2 style="color: #333; margin-bottom: 8px;">Password Reset</h2>' +
        '<p style="color: #666; font-size: 16px;">Hi ' + firstName + ',</p>' +
        '<p style="color: #666; font-size: 16px;">Here is your password reset code:</p>' +
        '<div style="background: #F3F4F6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">' +
        '<span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">' + resetToken + '</span>' +
        '</div>' +
        '<p style="color: #666; font-size: 14px;">This code expires in 1 hour. If you didn\'t request this, you can safely ignore this email.</p>' +
        '<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />' +
        '<p style="color: #999; font-size: 12px;">BumpMatch - Find the perfect baby name together.</p>' +
        '</div>';

    } else {
      subject = data.subject || "BumpMatch";
      htmlBody = data.htmlBody || "";
    }

    GmailApp.sendEmail(to, subject, "", { htmlBody: htmlBody });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this in the editor to verify it works
function testWelcomeEmail() {
  var e = {
    postData: {
      contents: JSON.stringify({
        type: "welcome",
        to: "your-test-email@gmail.com",  // Change this to your email
        firstName: "Test",
        inviteCode: "NDLOVU-AB12"
      })
    }
  };
  var result = doPost(e);
  Logger.log(result.getContent());
}
