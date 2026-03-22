(function () {
  "use strict";

  function formatCurrencyFromEth(ethValue) {
    var usdRate = 3250;
    var usdValue = ethValue * usdRate;
    return "($" + usdValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ")";
  }

  function parseEthValue(text) {
    var match = (text || "").match(/([0-9]+(?:\.[0-9]+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  function showInlineMessage(element, message, tone) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = "app-message " + (tone || "info");
    element.hidden = false;
  }

  function setupCreateForm() {
    var form = document.querySelector("#contact[data-create-form]");
    if (!form) {
      return;
    }

    var message = document.getElementById("create-form-message");
    var preview = {
      title: document.getElementById("preview-title"),
      description: document.getElementById("preview-description"),
      username: document.getElementById("preview-username"),
      ownerName: document.getElementById("preview-owner-name"),
      ownerHandle: document.getElementById("preview-owner-handle"),
      priceEth: document.getElementById("preview-price-eth"),
      priceUsd: document.getElementById("preview-price-usd"),
      royalties: document.getElementById("preview-royalties"),
      image: document.getElementById("preview-image")
    };

    function updatePreview() {
      var title = form.querySelector("#title").value.trim() || "Untitled Collection Piece";
      var description = form.querySelector("#description").value.trim() || "Add a short description to tell collectors what makes this piece special.";
      var username = form.querySelector("#username").value.trim() || "@yourhandle";
      var price = form.querySelector("#price").value.trim();
      var royalties = form.querySelector("#royalties").value.trim() || "10% creator royalty";
      var normalizedPrice = parseEthValue(price);

      preview.title.textContent = title;
      preview.description.textContent = description;
      preview.username.textContent = username;
      preview.ownerName.textContent = username.replace(/^@/, "") || "Creator";
      preview.ownerHandle.textContent = username;
      preview.priceEth.textContent = normalizedPrice > 0 ? normalizedPrice.toFixed(2) + " ETH" : "0.00 ETH";
      preview.priceUsd.textContent = formatCurrencyFromEth(normalizedPrice);
      preview.royalties.textContent = royalties;
    }

    form.addEventListener("input", updatePreview);

    var fileInput = form.querySelector("#file");
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file || !preview.image || !file.type.match(/^image\//)) {
          return;
        }

        var reader = new FileReader();
        reader.onload = function (event) {
          preview.image.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var payload = {
        title: form.querySelector("#title").value.trim(),
        description: form.querySelector("#description").value.trim(),
        username: form.querySelector("#username").value.trim(),
        price: form.querySelector("#price").value.trim(),
        royalties: form.querySelector("#royalties").value.trim(),
        submittedAt: new Date().toISOString()
      };

      var existingItems = [];
      try {
        existingItems = JSON.parse(localStorage.getItem("collectorHubDrafts") || "[]");
      } catch (_error) {
        existingItems = [];
      }

      existingItems.unshift(payload);
      localStorage.setItem("collectorHubDrafts", JSON.stringify(existingItems.slice(0, 10)));

      showInlineMessage(message, "Your item draft was saved in this browser. Connect a backend next to publish it for real.", "success");
    });

    updatePreview();
  }

  function setupExploreSearch() {
    var form = document.querySelector("#search-form[data-explore-form]");
    if (!form) {
      return;
    }

    var items = Array.prototype.slice.call(document.querySelectorAll(".discover-items .item-card")).map(function (item) {
      return item.parentElement;
    });
    var resultLabel = document.getElementById("explore-results-label");
    var keywordField = document.getElementById("explore-keyword");
    var categoryField = document.getElementById("explore-category");
    var sortField = document.getElementById("explore-sort");

    function getPrice(item) {
      var bidText = item.querySelector("[data-item-price]");
      return parseEthValue(bidText ? bidText.textContent : "");
    }

    function getTitle(item) {
      var heading = item.querySelector("h4");
      return heading ? heading.textContent.trim() : "";
    }

    function applyFilters(event) {
      if (event) {
        event.preventDefault();
      }

      var keyword = keywordField.value.trim().toLowerCase();
      var category = categoryField.value;

      items.forEach(function (item) {
        var card = item.querySelector(".item-card");
        var itemText = item.textContent.toLowerCase();
        var itemCategory = card ? (card.getAttribute("data-category") || "") : "";
        var matchesKeyword = !keyword || itemText.indexOf(keyword) !== -1;
        var matchesCategory = !category || category === "all" || itemCategory === category;

        item.style.display = matchesKeyword && matchesCategory ? "" : "none";
      });

      var visibleItems = items.filter(function (item) {
        return item.style.display !== "none";
      });

      visibleItems.sort(function (left, right) {
        if (sortField.value === "price-low") {
          return getPrice(left) - getPrice(right);
        }
        if (sortField.value === "price-high") {
          return getPrice(right) - getPrice(left);
        }
        if (sortField.value === "title") {
          return getTitle(left).localeCompare(getTitle(right));
        }
        return 0;
      });

      visibleItems.forEach(function (item) {
        item.parentNode.appendChild(item);
      });

      if (resultLabel) {
        resultLabel.textContent = visibleItems.length + " listing" + (visibleItems.length === 1 ? "" : "s") + " shown";
      }
    }

    form.addEventListener("submit", applyFilters);
    categoryField.addEventListener("change", applyFilters);
    sortField.addEventListener("change", applyFilters);
    keywordField.addEventListener("input", applyFilters);

    applyFilters();
  }

  function setupBidForm() {
    var form = document.querySelector("form[data-bid-form]");
    if (!form) {
      return;
    }

    var amountField = document.getElementById("bid-amount");
    var currentBid = document.getElementById("current-bid-value");
    var currentBidUsd = document.getElementById("current-bid-usd");
    var message = document.getElementById("bid-form-message");
    var bidFeed = document.getElementById("bid-feed");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var nextBid = parseEthValue(amountField.value);
      var previousBid = parseEthValue(currentBid.textContent);

      if (!nextBid || nextBid <= previousBid) {
        showInlineMessage(message, "Enter a bid higher than the current highest offer.", "error");
        return;
      }

      currentBid.textContent = nextBid.toFixed(2) + " ETH";
      currentBidUsd.textContent = formatCurrencyFromEth(nextBid);

      var bidItem = document.createElement("div");
      bidItem.className = "col-lg-4 col-md-6";
      bidItem.innerHTML = [
        '<div class="item">',
        '  <div class="left-img">',
        '    <img src="assets/images/current-04.jpg" alt="New bidder avatar">',
        "  </div>",
        '  <div class="right-content">',
        "    <h4>Guest Collector</h4>",
        '    <a href="#">@guestcollector</a>',
        '    <div class="line-dec"></div>',
        "    <h6>Bid: <em>" + nextBid.toFixed(2) + " ETH</em></h6>",
        "    <span class=\"date\">Just now</span>",
        "  </div>",
        "</div>"
      ].join("");

      bidFeed.insertBefore(bidItem, bidFeed.children[2] || null);
      amountField.value = "";
      showInlineMessage(message, "Bid submitted in demo mode. The current bid and activity feed were updated locally.", "success");
    });
  }

  function setupFollowButton() {
    var button = document.querySelector("[data-follow-button]");
    var count = document.querySelector("[data-follow-count]");
    if (!button || !count) {
      return;
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();

      var isFollowing = button.getAttribute("data-following") === "true";
      var currentCount = parseInt(count.textContent, 10) || 0;

      if (isFollowing) {
        button.textContent = "Follow @melanie32";
        button.setAttribute("data-following", "false");
        count.textContent = Math.max(0, currentCount - 1);
      } else {
        button.textContent = "Following @melanie32";
        button.setAttribute("data-following", "true");
        count.textContent = currentCount + 1;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupCreateForm();
    setupExploreSearch();
    setupBidForm();
    setupFollowButton();
  });

  if (typeof window !== "undefined") {
    window.__collectorHubApp = {
      formatCurrencyFromEth: formatCurrencyFromEth,
      parseEthValue: parseEthValue,
      showInlineMessage: showInlineMessage,
      setupCreateForm: setupCreateForm,
      setupExploreSearch: setupExploreSearch,
      setupBidForm: setupBidForm,
      setupFollowButton: setupFollowButton
    };
  }
})();
