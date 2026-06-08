#!/usr/bin/env node

export function main(): void {
  console.log("SoroBench CLI — coming soon");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
