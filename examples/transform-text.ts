import { generateText } from '../src/index';

const PRODUCT_DESCRIPTION =
  'Handmade soy candle, 8oz, lavender and cedarwood scent, hand-poured in small batches, burns about 50 hours, comes in a reusable glass jar.';

async function main() {
  const result = await generateText({ input: PRODUCT_DESCRIPTION });

  if (!result.success) {
    console.error(`Text generation failed: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(result.text);
}

main().catch((err) => {
  console.error(`Text generation failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
