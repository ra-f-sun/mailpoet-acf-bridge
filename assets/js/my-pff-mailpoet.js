// Function to inject the "Prepare for Frontend" button and set up its handler
function injectPffButtons() {
  // Find each newsletter row (with unique data-automation-id)
  jQuery('tr[data-automation-id^="listing_item_"]').each(function () {
    var $actions = jQuery(this).find(".mailpoet-listing-actions");
    // Only append if not already present
    if ($actions.length && $actions.find(".pff-btn").length === 0) {
      // console.log("On the way to append");
      $actions.append(' • <a href="#" class="pff-btn"> PFF</a>');
    }
    // console.log("Successfully Appended");
  });

  // Click handler for each (re-attached every call to avoid duplicates)
  jQuery(".pff-btn")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      var $row = jQuery(this).closest("tr");

      // Get the subject line and remove the whitespace
      var subject = $row.find(".mailpoet-listing-title").text().trim();

      // Get preview URL (href of 'View' link), if not, use empty string
      var previewUrl = $row.find("span.view a").attr("href") || "";

      // Get newsletter ID from Stats link (format: '#/stats/16'), if not, use empty string
      var statsHref = $row.find("span.stats a").attr("href") || "";
      var newsletterId = "";
      var match = statsHref.match(/#\/stats\/(\d+)/); // regex to extract ID
      if (match) newsletterId = match[1];

      // Get sent date (last <td> in row) and remove the whitespace
      var sentDate = $row.find("td").last().text().trim();

      // ... inside your click handler, after collecting subject, previewUrl, newsletterId, sentDate:
      jQuery.ajax({
        url: pffAjax.ajax_url,
        type: "POST",
        dataType: "json",
        data: {
          action: "pff_create_newsletter", // unique action name for WP
          security: pffAjax.nonce,
          test_message: "AJAX is connected!",
          subject: subject,
          preview_url: previewUrl,
          newsletter_id: newsletterId,
          sent_date: sentDate,
        },
        success: function (response) {
          // console.log("Server says:", response);
          // alert("AJAX success! Server response:\n" + JSON.stringify(response));

          if (response.success && response.data.edit_url) {
            // Optionally, ask for confirmation:
            if (response.data.duplicate) {
              if (
                confirm("This newsletter was already prepared. Go to edit now?")
              ) {
                window.open(response.data.edit_url, "_blank");
              }
            } else {
              window.open(response.data.edit_url, "_blank");
            }
          } else {
            alert(
              "Error: " +
                (response.data && response.data.message
                  ? response.data.message
                  : "Unknown error")
            );
          }
        },
        error: function (xhr, status, error) {
          alert("AJAX failed! Check console for details.");
          console.error(error);
        },
      });
    });
}

// Run the function after the page loads and again after a short delay
jQuery(document).ready(function ($) {
  injectPffButtons();
  setInterval(injectPffButtons, 1000);
});

// Bulk selection function

function injectBulkPffButton() {
  var $bulkActions = jQuery(
    '.mailpoet-listing-bulk-actions[data-automation-id="listing-bulk-actions"]'
  );
  if ($bulkActions.length && $bulkActions.find("#pff-bulk-btn").length === 0) {
    // Place "Send All to PFF" button beside Move to trash
    $bulkActions.append(
      '<div><a href="#" id="pff-bulk-btn" class="button button-secondary" style="">Send All to PFF</a></div>'
    );
  }
}

// Only show the bulk button when one or more are selected
function updateBulkBtnVisibility() {
  var checked = jQuery('tbody input[type="checkbox"]:checked').not(
    '[name="check_all"]'
  );
  if (checked.length > 0) {
    jQuery("#pff-bulk-btn").show();
  } else {
    jQuery("#pff-bulk-btn").hide();
  }
}

jQuery(document).ready(function ($) {
  injectBulkPffButton();
  setInterval(injectBulkPffButton, 1000); // Ensure it always exists even if DOM changes

  // Show/hide on checklist changes
  $(document).on(
    "change",
    'tbody input[type="checkbox"], thead input[type="checkbox"]',
    updateBulkBtnVisibility
  );

  // Hide at start
  $("#pff-bulk-btn").hide();

  // Confirm basic working
  $(document).on("click", "#pff-bulk-btn", function (e) {
    e.preventDefault();
    alert("Bulk Send All to PFF triggered!");
  });
});
