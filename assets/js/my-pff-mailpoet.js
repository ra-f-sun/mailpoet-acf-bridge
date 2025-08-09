function pffInjectBulkUI(totalCount) {
  // Inline progress bar
  if (jQuery("#pff-bulk-progress").length === 0) {
    jQuery(".mailpoet-listing-table").before(`
            <div id="pff-bulk-progress" style="display:none;margin:10px 0;">
                <div style="background:#e0e3ec;border-radius:7px;overflow:hidden;">
                    <div id="pff-bulk-bar" style="background:#7c3aed;height:18px;width:0%;transition:width 0.254s;"></div>
                </div>
                <div id="pff-bulk-text" style="font-size:13px;margin-top:3px;"></div>
            </div>
        `);
  }
  // Modal
  if (jQuery("#pff-bulk-modal").length === 0) {
    jQuery("body").append(`
            <div id="pff-bulk-modal" style="display:none;position:fixed;z-index:99999;left:0;top:0;width:100vw;height:100vh;background:rgba(48,48,72,0.72);">
                <div style="background:white;max-width:410px;margin:90px auto;padding:24px 24px 10px 24px;border-radius:12px;box-shadow:0 12px 36px #0002;">
                    <div id="pff-bulk-modal-title" style="font-weight:bold;font-size:19px;margin-bottom:10px;">Preparing Newsletters…</div>
                    <div id="pff-bulk-modal-bar-outer" style="background:#e0e3ec;border-radius:7px;height:16px;overflow:hidden;margin-bottom:9px;">
                        <div id="pff-bulk-modal-bar-inner" style="background:#7c3aed;height:100%;width:0%;transition:width 0.254s;"></div>
                    </div>
                    <div id="pff-bulk-modal-status" style="font-size:14px;"></div>
                    <div id="pff-bulk-modal-summary" style="margin-top:8px;font-size:13px;max-height:95px;overflow-y:auto;"></div>
                    <button id="pff-bulk-modal-close" style="display:none;margin:16px auto 0 auto;display:block;background:#7c3aed;border:none;color:#fff;border-radius:4px;padding:7px 22px;font-weight:600;font-size:16px;cursor:pointer;">Close</button>
                </div>
            </div>
        `);
  }
  // Reset
  jQuery("#pff-bulk-progress").show();
  jQuery("#pff-bulk-bar").css("width", "0%");
  jQuery("#pff-bulk-text").text("");
  jQuery("#pff-bulk-modal").show();
  jQuery("#pff-bulk-modal-bar-inner").css("width", "0%");
  jQuery("#pff-bulk-modal-title").text("Preparing Newsletters…");
  jQuery("#pff-bulk-modal-status").text("");
  jQuery("#pff-bulk-modal-summary").html("");
  jQuery("#pff-bulk-modal-close").hide();
}

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

// Bulk PFF

// Create container for bulk action button
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
  // $(document).on("click", "#pff-bulk-btn", function (e) {
  //   e.preventDefault();
  //   alert("Bulk Send All to PFF triggered!");
  // });

  $(document).on("click", "#pff-bulk-btn", function (e) {
    e.preventDefault();

    // 1. Collect all checked newsletters
    let selectedRows = [];
    $('tbody input[type="checkbox"]:checked')
      .not('[name="check_all"]')
      .each(function () {
        let $row = $(this).closest("tr");
        let subject = $row.find(".mailpoet-listing-title").text().trim();
        let previewUrl = $row.find("span.view a").attr("href") || "";
        let statsHref = $row.find("span.stats a").attr("href") || "";
        let newsletterId = "";
        let match = statsHref.match(/#\/stats\/(\d+)/);
        if (match) newsletterId = match[1];
        let sentDate = $row.find("td").last().text().trim();

        // Store all info as an object
        selectedRows.push({
          subject: subject,
          preview_url: previewUrl,
          newsletter_id: newsletterId,
          sent_date: sentDate,
        });
      });

    // 2. Confirmation dialog with summary
    if (selectedRows.length === 0) {
      alert("No newsletters selected.");
      return;
    }
    let msg =
      "Are you sure you want to send " +
      selectedRows.length +
      " newsletter(s) to PFF?";
    msg +=
      "\n\n" +
      selectedRows
        .slice(0, 5)
        .map((i) => "- " + i.subject)
        .join("\n");
    if (selectedRows.length > 5)
      msg += "\n...and " + (selectedRows.length - 5) + " more.";

    // if (confirm(msg)) {
    //   // For now, just show a test alert
    //   alert(
    //     "Confirmed! Planning to create drafts for: \n\n" +
    //       selectedRows.map((i) => i.subject).join("\n")
    //   );
    //   // Here we’ll do the actual chunked AJAX in the next step
    // }

    if (confirm(msg)) {
      // -- Bulk/Chunk Processing Logic --
      pffInjectBulkUI(selectedRows.length);

      const BATCH_SIZE = 10;
      let batches = [];
      for (let i = 0; i < selectedRows.length; i += BATCH_SIZE) {
        batches.push(selectedRows.slice(i, i + BATCH_SIZE));
      }
      let allResults = [];
      let currentBatch = 0;
      let processed = 0;

      /*
        function processNextBatch(){
        if(currentBatch >= batches.length){
            // All batches done—show a summary dialog
            alert('All batches processed! See console for batch details.');
            console.log('All Results:', allResults);
            return;
        }
        let thisBatch = batches[currentBatch];
        $.ajax({
            url: pffAjax.ajax_url,
            type: "POST",
            dataType: "json",
            data: {
                action: "pff_create_bulk_newsletters",
                newsletters: JSON.stringify(thisBatch),
                security: pffAjax.nonce
            },
            success: function(response){
                if(response.success && response.data && response.data.batch_results){
                    allResults = allResults.concat(response.data.batch_results);
                    console.log(`Batch ${currentBatch+1} results:`, response.data.batch_results);
                } else {
                    console.warn('Batch failed or incomplete response', response);
                }
                currentBatch++;
                setTimeout(processNextBatch, 1000); // Wait 1s before next batch
            },
            error: function(xhr, status, error){
                console.error("AJAX error:", error);
                currentBatch++;
                setTimeout(processNextBatch, 1000);
            }
        });
    }
      */

      function updateBulkUI(processed, total, batchResults) {
        let pct = Math.round((100 * processed) / total);
        $("#pff-bulk-bar").css("width", pct + "%");
        $("#pff-bulk-modal-bar-inner").css("width", pct + "%");
        $("#pff-bulk-modal-title").text(
          `Preparing Newsletters… (${processed} of ${total})`
        );
        $("#pff-bulk-text").text(
          `${processed} of ${total} newsletters processed (${pct}%)`
        );
        $("#pff-bulk-modal-status").text(
          `${processed} of ${total} newsletters processed (${pct}%)`
        );
        if (batchResults && batchResults.length > 0) {
          $("#pff-bulk-modal-summary").html(
            batchResults
              .map((r) => `<div>[${r.status}] ${r.subject} - ${r.msg}</div>`)
              .join("")
          );
        }
      }

      function showBulkUIFinal(results) {
        const created = results.filter((r) => r.status === "created");
        const duplicate = results.filter((r) => r.status === "duplicate");
        const failed = results.filter((r) => r.status === "failed");
        let html = `<b>Summary:</b><br>`;
        html += `<span style="color:green">${created.length} created</span><br>`;
        html += `<span style="color:orange">${duplicate.length} duplicate</span><br>`;
        html += `<span style="color:red">${failed.length} failed</span><br><br>`;
        if (failed.length) {
          html +=
            `<b>Failed:</b><br>` +
            failed
              .map(
                (r) => `<div style="color:red">- ${r.subject} (${r.msg})</div>`
              )
              .join("");
        }
        if (duplicate.length) {
          html +=
            `<b>Duplicates:</b><br>` +
            duplicate
              .map((r) => `<div style="color:orange">- ${r.subject}</div>`)
              .join("");
        }
        $("#pff-bulk-modal-summary").html(html);
        $("#pff-bulk-modal-title").text("All Newsletters Processed!");
        $("#pff-bulk-modal-status").text("");
        $("#pff-bulk-bar").css("width", "100%");
        $("#pff-bulk-modal-bar-inner").css("width", "100%");
        $("#pff-bulk-modal-close").show();
        setTimeout(() => $("#pff-bulk-progress").fadeOut(), 4000);
      }

      function processNextBatch() {
        if (currentBatch >= batches.length) {
          showBulkUIFinal(allResults);
          return;
        }
        let thisBatch = batches[currentBatch];
        $.ajax({
          url: pffAjax.ajax_url,
          type: "POST",
          dataType: "json",
          data: {
            action: "pff_create_bulk_newsletters",
            newsletters: JSON.stringify(thisBatch),
            security: pffAjax.nonce,
          },
          success: function (response) {
            let resultsThis = [];
            if (
              response.success &&
              response.data &&
              response.data.batch_results
            ) {
              allResults = allResults.concat(response.data.batch_results);
              resultsThis = response.data.batch_results;
            }
            processed += thisBatch.length;
            updateBulkUI(processed, selectedRows.length, resultsThis);
            currentBatch++;
            setTimeout(processNextBatch, 900);
          },
          error: function () {
            processed += thisBatch.length;
            currentBatch++;
            updateBulkUI(processed, selectedRows.length, []);
            setTimeout(processNextBatch, 900);
          },
        });
      }

      $(document).one("click", "#pff-bulk-modal-close", function () {
        $("#pff-bulk-modal").hide();
      });

      processNextBatch();
    }
  });
});
