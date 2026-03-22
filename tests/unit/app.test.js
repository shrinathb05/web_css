import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock localStorage for the Vitest environment 
if (typeof window !== 'undefined' && !window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: {
      clear: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true
  });
}

async function loadAppScript() {
  window.localStorage.clear();
  delete window.__collectorHubApp;
  vi.restoreAllMocks();
  vi.resetModules();
  await import("../../assets/js/app.js");
  return window.__collectorHubApp;
}

describe("collector hub app helpers", () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  it("parses ETH values from listing text", async () => {
    const app = await loadAppScript();

    expect(app.parseEthValue("6.40 ETH")).toBe(6.4);
    expect(app.parseEthValue("Bid: 0.75 ETH")).toBe(0.75);
    expect(app.parseEthValue("No value")).toBe(0);
  });

  it("formats ETH values into USD display text", async () => {
    const app = await loadAppScript();

    expect(app.formatCurrencyFromEth(1.5)).toBe("($4,875.00)");
  });
});

describe("create listing flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T12:00:00.000Z"));
  });

  it("updates the preview and stores the draft locally", async () => {
    document.body.innerHTML = `
      <form id="contact" data-create-form>
        <input id="title" value="">
        <input id="description" value="">
        <input id="username" value="">
        <input id="price" value="">
        <input id="royalties" value="">
        <input id="file" type="file">
        <button type="submit">Save</button>
        <div id="create-form-message" hidden></div>
      </form>
      <div id="preview-title"></div>
      <div id="preview-description"></div>
      <div id="preview-username"></div>
      <div id="preview-owner-name"></div>
      <div id="preview-owner-handle"></div>
      <div id="preview-price-eth"></div>
      <div id="preview-price-usd"></div>
      <div id="preview-royalties"></div>
      <img id="preview-image" src="assets/images/create-yours.jpg" alt="Preview">
    `;

    const app = await loadAppScript();
    app.setupCreateForm();

    document.getElementById("title").value = "Aurora";
    document.getElementById("description").value = "A luminous drop";
    document.getElementById("username").value = "@atlas";
    document.getElementById("price").value = "1.25 ETH";
    document.getElementById("royalties").value = "12% creator royalty";
    document.getElementById("contact").dispatchEvent(new Event("input", { bubbles: true }));

    expect(document.getElementById("preview-title").textContent).toBe("Aurora");
    expect(document.getElementById("preview-owner-name").textContent).toBe("atlas");
    expect(document.getElementById("preview-price-eth").textContent).toBe("1.25 ETH");
    expect(document.getElementById("preview-price-usd").textContent).toBe("($4,062.50)");

    document.getElementById("contact").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    const savedDrafts = JSON.parse(window.localStorage.getItem("collectorHubDrafts"));
    expect(savedDrafts).toHaveLength(1);
    expect(savedDrafts[0]).toMatchObject({
      title: "Aurora",
      description: "A luminous drop",
      username: "@atlas",
      price: "1.25 ETH",
      royalties: "12% creator royalty",
      submittedAt: "2026-03-22T12:00:00.000Z"
    });

    const message = document.getElementById("create-form-message");
    expect(message.hidden).toBe(false);
    expect(message.className).toContain("success");
  });
});

describe("bid flow", () => {
  it("rejects bids lower than the current offer", async () => {
    document.body.innerHTML = `
      <form data-bid-form>
        <input id="bid-amount" value="5.50 ETH">
        <button type="submit">Bid</button>
      </form>
      <strong id="current-bid-value">6.06 ETH</strong>
      <em id="current-bid-usd">($19,695.00)</em>
      <div id="bid-form-message" hidden></div>
      <div id="bid-feed">
        <div>Heading</div>
        <div>Sort</div>
        <div>Existing bid</div>
      </div>
    `;

    const app = await loadAppScript();
    app.setupBidForm();
    document.querySelector("[data-bid-form]").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(document.getElementById("current-bid-value").textContent).toBe("6.06 ETH");
    expect(document.getElementById("bid-form-message").textContent).toContain("higher than the current highest offer");
  });
});
