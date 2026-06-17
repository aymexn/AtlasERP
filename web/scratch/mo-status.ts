import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const interactionCount = await prisma.customerInteraction.count();
    console.log(`TOTAL CUSTOMER INTERACTIONS IN DATABASE: ${interactionCount}`);
  } catch (err: any) {
    console.error('Error counting customer interactions:', err.message);
  }
}

main().catch(console.error);
