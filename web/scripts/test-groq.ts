import { getGroqExplanation } from '../src/lib/ai/groq-client';
import * as fs from 'fs';
import * as path from 'path';

// Manually load environment variables from web/.env.local
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*?)\s*$/);
      if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[match[1]] = val;
      }
    });
  }
} catch (err) {
  console.error("Failed to manually read .env.local file:", err);
}

async function test() {
  console.log("=========================================");
  console.log("Starting Groq Cloud Integration Test");
  console.log("=========================================");
  console.log("ENABLE_GROQ:", process.env.ENABLE_GROQ);
  console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "Loaded (present)" : "Missing");

  const testPrompt = `Tu es un assistant IA spécialisé en gestion de stocks. Voici une situation critique :
Produit : Peinture Rouge Satinée
Stock actuel : 5 unités (seuil d'alerte : 20)
Ventes moyennes : 8 unités/semaine
Délai réapprovisionnement : 7 jours
Perte estimée si rupture : 45000 DA

Rédige un résumé court (2 phrases maximum) pour un responsable commercial, en français.`;

  console.log("Testing getGroqExplanation...");
  const start = Date.now();
  const summary = await getGroqExplanation(testPrompt);
  const duration = Date.now() - start;

  console.log(`Execution completed in ${duration}ms.`);
  console.log("Result summary:", summary ? `"${summary}"` : "(Empty string returned)");
  console.log("=========================================");
}

test();
