import { generateMissingThumbnails } from "./server/generateTemplateThumbnail";
import { getAllPresentationTemplates, updatePresentationTemplate } from "./server/db";

async function main() {
  console.log("Fetching templates...");
  const templates = await getAllPresentationTemplates();
  console.log(`Found ${templates.length} templates`);
  
  console.log("Generating thumbnails...");
  const results = await generateMissingThumbnails(templates);
  
  console.log(`Generated ${results.length} thumbnails`);
  
  for (const result of results) {
    await updatePresentationTemplate(result.id, {
      thumbnailUrl: result.thumbnailUrl,
      thumbnailKey: result.thumbnailKey,
    });
    console.log(`Updated template ${result.id} with thumbnail`);
  }
  
  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
