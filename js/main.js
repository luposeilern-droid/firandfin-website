document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("is-ready");

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  var mailtoForms = document.querySelectorAll("form[data-mailto]");
  mailtoForms.forEach(function (mailtoForm) {
    mailtoForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var email = mailtoForm.getAttribute("data-mailto");
      var subjectField = mailtoForm.elements.subject;
      var messageField = mailtoForm.elements.message;
      var subject = subjectField ? subjectField.value.trim() : "";
      var message = messageField ? messageField.value.trim() : "";
      var prefix = mailtoForm.getAttribute("data-mailto-prefix");
      var bodyLines = [];
      var fields = mailtoForm.querySelectorAll("input[name], textarea[name], select[name]");

      fields.forEach(function (field) {
        var fieldName = field.name;
        var value = field.value.trim();

        if (!value || fieldName === "subject" || fieldName === "message") {
          return;
        }

        var label = field.getAttribute("data-label") || fieldName;
        bodyLines.push(label + ": " + value);
      });

      if (prefix) {
        bodyLines.unshift(prefix);
      }

      if (message) {
        bodyLines.push("");
        bodyLines.push(message);
      }

      var mailtoUrl =
        "mailto:" +
        encodeURIComponent(email) +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailtoUrl;
    });
  });

  function parseSeasonRange(text, today) {
    var cleaned = text.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    var lowered = cleaned.toLowerCase();
    var monthMap = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11
    };

    if (
      lowered.indexOf("year-round") !== -1 ||
      lowered.indexOf("1 january - 31 december") !== -1
    ) {
      return { state: "open", label: "Open today" };
    }

    if (
      lowered.indexOf("very limited") !== -1 ||
      lowered.indexOf("protected") !== -1 ||
      lowered.indexOf("suspended") !== -1 ||
      lowered.indexOf("check local") !== -1 ||
      lowered.indexOf("check current") !== -1 ||
      lowered.indexOf("conservation review") !== -1
    ) {
      return { state: "caution", label: "Check local rules" };
    }

    var match = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s*-\s*(\d{1,2})\s+([A-Za-z]+)/);
    if (!match) {
      return { state: "caution", label: "Check local rules" };
    }

    var startDay = parseInt(match[1], 10);
    var startMonth = monthMap[match[2].toLowerCase()];
    var endDay = parseInt(match[3], 10);
    var endMonth = monthMap[match[4].toLowerCase()];

    if (typeof startMonth === "undefined" || typeof endMonth === "undefined") {
      return { state: "caution", label: "Check local rules" };
    }

    var currentValue = today.getMonth() * 100 + today.getDate();
    var startValue = startMonth * 100 + startDay;
    var endValue = endMonth * 100 + endDay;
    var isOpen;

    if (startValue <= endValue) {
      isOpen = currentValue >= startValue && currentValue <= endValue;
    } else {
      isOpen = currentValue >= startValue || currentValue <= endValue;
    }

    return {
      state: isOpen ? "open" : "closed",
      label: isOpen ? "Open today" : "Closed today"
    };
  }

  function enhanceSeasonTables() {
    var seasonTables = document.querySelectorAll(".season-table");
    if (!seasonTables.length) {
      return;
    }

    var today = new Date();
    var note = document.getElementById("season-status-note");
    if (note) {
      note.textContent =
        "Status icons are based on today's date: " +
        today.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }) +
        ".";
    }

    seasonTables.forEach(function (table) {
      var headRow = table.querySelector("thead tr");
      if (headRow && !headRow.querySelector(".season-status-head")) {
        var statusHead = document.createElement("th");
        statusHead.className = "season-status-head";
        statusHead.textContent = "Now";
        headRow.insertBefore(statusHead, headRow.firstElementChild);
      }

      var rows = table.querySelectorAll("tbody tr");
      rows.forEach(function (row) {
        var cells = row.querySelectorAll("td");
        if (!cells.length) {
          return;
        }

        if (cells.length === 1 && cells[0].hasAttribute("colspan")) {
          cells[0].setAttribute("colspan", "4");
          return;
        }

        if (row.querySelector(".season-status-cell")) {
          return;
        }

        var openSeasonCell = cells[1];
        if (!openSeasonCell) {
          return;
        }

        var status = parseSeasonRange(openSeasonCell.textContent, today);
        var statusCell = document.createElement("td");
        var statusPill = document.createElement("span");

        statusCell.className = "season-status-cell";
        statusPill.className = "season-status-pill " + status.state;
        statusPill.title = status.label;
        statusPill.setAttribute("aria-label", status.label);
        statusPill.textContent =
          status.state === "open" ? "✓" : status.state === "closed" ? "×" : "!";

        statusCell.appendChild(statusPill);
        row.insertBefore(statusCell, row.firstElementChild);
      });
    });
  }

  enhanceSeasonTables();
});
