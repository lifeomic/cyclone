#!/usr/bin/env node

import madge from 'madge';
import graphlib from 'graphlib';
import fs from 'fs';
import { z } from 'zod';

const RegExpConfig = z.object({
  value: z.string(),
  negate: z.boolean().optional(),
  caseInsensitive: z.boolean().optional(),
});

const Config = z.object({
  targetDir: z.union([z.string(), z.array(z.string())]),
  disallowedDependencies: z.array(
    z.object({
      from: RegExpConfig,
      to: RegExpConfig,
      message: z.string().optional(),
    }),
  ),
  fileExtensions: z.array(z.string()).optional(),
});

const DEFAULT_FILE_EXTENSIONS = ['ts', 'js'];

const readConfig = () => {
  const rawConfig = JSON.parse(
    fs.readFileSync(`${process.cwd()}/cyclone.config.json`, 'utf-8'),
  );

  return Config.parse(rawConfig);
};

const main = async () => {
  const { targetDir, disallowedDependencies, fileExtensions } = readConfig();

  const result = await madge(targetDir, {
    fileExtensions: fileExtensions ?? DEFAULT_FILE_EXTENSIONS,
  });

  const graph = new graphlib.Graph();

  Object.entries(result.obj()).map(([key, dependencies]) => {
    for (const dependency of dependencies) {
      graph.setNode(key);
      graph.setEdge(key, dependency);
    }
  });

  let errorCount = 0;

  for (const { from, to, message } of disallowedDependencies) {
    const toRegExp = new RegExp(to.value, to.caseInsensitive ? 'i' : undefined);
    const fromRegExp = new RegExp(
      from.value,
      from.caseInsensitive ? 'i' : undefined,
    );
    const matchesToModule = (module: string) =>
      to.negate ? !toRegExp.test(module) : toRegExp.test(module);
    const matchesFromModule = (module: string) =>
      from.negate ? !fromRegExp.test(module) : fromRegExp.test(module);
    const toModules = Object.keys(result.obj()).filter(matchesToModule);

    for (const toModule of toModules) {
      const badDependents = result.depends(toModule).filter(matchesFromModule);

      if (badDependents.length > 0) {
        for (const badDependency of badDependents) {
          errorCount++;
          process.stderr.write(`${badDependency} depends on ${toModule}: `);
          const shortestPath = graphlib.alg.dijkstra(graph, badDependency);
          let current = toModule;
          while (current !== badDependency) {
            process.stderr.write(`${current} <- `);
            current = shortestPath[current].predecessor;
          }
          process.stderr.write(current);
          message && process.stderr.write(`\n  Hint: ${message}`);
          process.stderr.write('\n');
        }
      }
    }
  }

  if (errorCount > 0) {
    // eslint-disable-next-line no-console
    console.error(`✘ ${errorCount} bad dependency chain(s) found`);
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log('✔ No bad dependency chains detected');
  }

  // madge types don't have `circular` on the result, but it exists.
  const circular = (result as any).circular();
  if (circular.length > 0) {
    // eslint-disable-next-line no-console
    console.error('✘ Circular dependencies detected:\n', circular);
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log('✔ No circular dependencies detected');
  }
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
