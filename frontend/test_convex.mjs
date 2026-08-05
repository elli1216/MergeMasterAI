import { ConvexHttpClient } from 'convex/browser';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

async function main() {
  const prs = await client.query('pullRequests:getActivePRs');
  console.log(JSON.stringify(prs, null, 2));
}

main().catch(console.error);
