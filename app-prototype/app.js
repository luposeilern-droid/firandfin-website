document.addEventListener("DOMContentLoaded", function () {
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

    if (lowered.indexOf("year-round") !== -1 || lowered.indexOf("1 january - 31 december") !== -1) {
      return { state: "open", label: "Open today" };
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

  var seasonCards = document.querySelectorAll(".season-card-app");
  if (seasonCards.length) {
    var today = new Date();
    var note = document.getElementById("season-status-note-app");

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

    seasonCards.forEach(function (card) {
      var seasonText = card.getAttribute("data-open-season") || "";
      var pill = card.querySelector(".season-pill-app");
      if (!pill) {
        return;
      }

      var status = parseSeasonRange(seasonText, today);
      pill.className = "season-pill-app " + status.state;
      pill.textContent = status.state === "open" ? "Open" : status.state === "closed" ? "Closed" : "Check";
      pill.setAttribute("title", status.label);
      pill.setAttribute("aria-label", status.label);
    });
  }

  var seasonRows = document.querySelectorAll(".season-detail-data");
  if (seasonRows.length) {
    var seasonToday = new Date();
    seasonRows.forEach(function (row) {
      var seasonText = row.getAttribute("data-open-season") || "";
      var status = parseSeasonRange(seasonText, seasonToday);
      var statusCell = row.querySelector(".season-row-status");

      if (!statusCell) {
        return;
      }

      statusCell.className = "season-row-status " + status.state;
      statusCell.textContent = status.state === "open" ? "✓" : status.state === "closed" ? "×" : "!";
      statusCell.setAttribute("title", status.label);
      statusCell.setAttribute("aria-label", status.label);
    });
  }

  var countryToggles = document.querySelectorAll(".country-toggle");
  var detailBlocks = document.querySelectorAll(".season-detail-block");

  if (countryToggles.length && detailBlocks.length) {
    countryToggles.forEach(function (toggle) {
      var targetId = toggle.getAttribute("data-target");
      var target = document.getElementById(targetId);

      toggle.addEventListener("click", function () {
        detailBlocks.forEach(function (block) {
          block.classList.remove("is-open");
        });

        countryToggles.forEach(function (button) {
          button.classList.remove("is-open");
        });

        if (target) {
          target.classList.add("is-open");
          toggle.classList.add("is-open");
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }
});
