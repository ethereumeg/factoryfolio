import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const BASE_URL = "https://factoryfolio.deno.dev";

async function handleRequest(request: Request): Promise<Response> {
  const { pathname, searchParams } = new URL(request.url);

  if (pathname === "/") {
    return new Response(
      `<html>
        <head>
            <title></title>
            <link rel="stylesheet" href="style.css" />
        </head>
        <body>
            <h1>FactoryFolio</h1>
            <p>Devfolio → FactoryDAO export. The script downloads all projects from a given hackathon and formats them as a CSV ready for import into FactoryDAO.</p>
            <h2>Usage</h2>
            <p>
                Just go to url <code>${BASE_URL}/&lt;HackathonSlug&gt;</code>
            </p>
            <h2>Examples</h2>
            <ul>
                <li>ETHBerlin³: <code>/ethberlin</code> (<a href="/ethberlin">download</a>, <a href="/ethberlin?inline">inline</a>)</li>
                <li>ETHBrno²: <code>/ethbrno</code> (<a href="/ethbrno">download</a>, <a href="/ethbrno?inline">inline</a>)</li>
                <li>EthereumZuri.ch: <code>/ethereumzurich</code> (<a href="/ethereumzurich">download</a>, <a href="/ethereumzurich?inline">inline</a>)</li>
            </ul>
            <hr />
            <p>
                <a href="https://github.com/utxo-foundation/factoryfolio">Source code</a>, 
                author: <a href="https://twitter.com/treecz">tree</a> (<a href="https://t.me/treecz">telegram</a>)
            </p>
        </body>
        </html>`,
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  }

  const hackathonSlug = pathname.replace(/^\//, "");

  const req = await fetch("https://api.devfolio.co/api/search/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      hackathon_slugs: [hackathonSlug],
      size: 1000,
    }),
  });
  const data = await req.json();
  const col = (val) => `"${val.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  const separator = ",";

  const output = [["project_name", "project_tagline"].map(col).join(separator)];
  const list = data.hits.hits || [];

  if (searchParams.get("stats") !== null) {
    return new Response(JSON.stringify({
      projects_count: list.length,
    }));
  }

  for (const hit of list) {
    const item = hit._source;
    const url = `https://devfolio.co/projects/${item.slug}`
    output.push([item.name, item.tagline+" "+url].map(col).join(separator));
  }

  return new Response(output.join("\n"), {
    headers: {
      "Content-Disposition": (
        searchParams.get("inline") !== null
          ? "inline"
          : `attachment; filename="${hackathonSlug}_projects_${
            (new Date()).toISOString().replace(/:\./, "_")
          }.csv"`
      ),
    },
  });
}

serve(handleRequest);
