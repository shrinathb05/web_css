const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.resolve(process.cwd(), "reports/sonar");
const outputPath = path.join(outputDir, "test-execution.xml");

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function decodeXml(value) {
  return value
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseJunitCases(reportPath) {
  if (!fs.existsSync(reportPath)) {
    return [];
  }

  const report = fs.readFileSync(reportPath, "utf8");
  const casePattern = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>|<testcase\b([^>]*)\/>/g;
  const cases = [];
  let match;

  while ((match = casePattern.exec(report)) !== null) {
    const attributes = match[1] || match[3] || "";
    const body = match[2] || "";
    const nameMatch = attributes.match(/\bname="([^"]+)"/);
    const durationMatch = attributes.match(/\btime="([^"]+)"/);
    const name = decodeXml(nameMatch ? nameMatch[1] : "Unnamed test");
    const duration = durationMatch ? durationMatch[1] : "0";
    const status = body.includes("<failure") ? "failure" : body.includes("<skipped") ? "skipped" : "success";
    cases.push({ name, duration, status });
  }

  return cases;
}

function renderFile(pathname, cases) {
  if (!cases.length) {
    return [];
  }

  const lines = [`  <file path="${pathname}">`];
  cases.forEach((testCase) => {
    lines.push(`    <testCase name="${escapeXml(testCase.name)}" duration="${Math.round(Number(testCase.duration) * 1000)}">`);
    if (testCase.status === "failure") {
      lines.push("      <failure message=\"Test failed\" />");
    } else if (testCase.status === "skipped") {
      lines.push("      <skipped message=\"Test skipped\" />");
    }
    lines.push("    </testCase>");
  });
  lines.push("  </file>");
  return lines;
}

const unitCases = parseJunitCases(path.resolve(process.cwd(), "reports/vitest/results.xml"));
const integrationCases = parseJunitCases(path.resolve(process.cwd(), "reports/playwright/results.xml"));

const xmlLines = [
  "<testExecutions version=\"1\">",
  ...renderFile("tests/unit/app.test.js", unitCases),
  ...renderFile("tests/integration/site.spec.js", integrationCases),
  "</testExecutions>"
];

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, xmlLines.join("\n"));
console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
