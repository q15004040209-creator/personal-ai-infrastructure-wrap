#!/usr/bin/env node
/**
 * AIONE CLI — Command Line Interface
 * Agentic AI Infrastructure SDK
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AIONE } from '../AIONE';

const program = new Command();

program
  .name('aione')
  .description('AIONE — Agentic AI Infrastructure SDK')
  .version('1.0.0');

// Global SDK instance
let sdk: AIONE | null = null;

async function getSDK(): Promise<AIONE> {
  if (!sdk) {
    sdk = new AIONE({
      baseDir: path.join(process.env.HOME || process.env.USERPROFILE || '~', '.aione'),
      debug: process.env.DEBUG === 'true',
    });
    await sdk.init();
  }
  return sdk;
}

// --- Core Commands ---

program
  .command('init')
  .description('Initialize AIONE in the current directory')
  .option('-d, --dir <path>', 'Custom base directory')
  .action(async (opts) => {
    try {
      const baseDir = opts.dir || path.join(process.cwd(), '.aione');
      await fs.ensureDir(baseDir);
      console.log(chalk.green(`✓`) + ` AIONE initialized at ${baseDir}`);
    } catch (e) {
      console.error(chalk.red(`✗ Init failed:`), e);
      process.exit(1);
    }
  });

// --- Memory Commands ---

const memoryCmd = program.command('memory').description('Memory system commands');

memoryCmd
  .command('add <content>')
  .description('Add a memory entry')
  .option('-t, --type <type>', 'Memory type (WORK|KNOWLEDGE|LEARNING|RELATIONSHIP|OBSERVATION|STATE)', 'WORK')
  .option('--tag <tags...>', 'Tags for the memory')
  .action(async (content, opts) => {
    try {
      const aione = await getSDK();
      const entry = await aione.remember({
        type: opts.type as any,
        content,
        tags: opts.tag,
        importance: 3,
      });
      console.log(chalk.green(`✓`) + ` Memory added: ${entry.id}`);
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

memoryCmd
  .command('search [query]')
  .description('Search memories')
  .option('-t, --type <type>', 'Filter by type')
  .option('-l, --limit <n>', 'Limit results', '10')
  .action(async (query, opts) => {
    try {
      const aione = await getSDK();
      const results = await aione.recall({
        search: query,
        type: opts.type as any,
        limit: parseInt(opts.limit),
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No memories found'));
        return;
      }

      console.log(chalk.bold(`\nFound ${results.length} memories:\n`));
      for (const entry of results) {
        console.log(chalk.cyan(`[${entry.type}]`) + ` ${entry.timestamp}`);
        console.log(`  ${entry.content.slice(0, 100)}${entry.content.length > 100 ? '...' : ''}`);
        if (entry.tags?.length) {
          console.log(`  Tags: ${entry.tags.join(', ')}`);
        }
        console.log();
      }
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

memoryCmd
  .command('stats')
  .description('Show memory statistics')
  .action(async () => {
    try {
      const aione = await getSDK();
      const stats = await aione.memoryStats();
      console.log(chalk.bold('\n📊 Memory Statistics\n'));
      console.log(`Total entries: ${chalk.cyan(stats.total.toString())}`);
      console.log('\nBy type:');
      for (const [type, count] of Object.entries(stats.byType)) {
        if (count > 0) {
          console.log(`  ${type}: ${chalk.green(count.toString())}`);
        }
      }
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

// --- Skill Commands ---

const skillsCmd = program.command('skills').description('Skill system commands');

skillsCmd
  .command('list')
  .description('List all installed skills')
  .action(async () => {
    try {
      const aione = await getSDK();
      const skills = await aione.listSkills();
      if (skills.length === 0) {
        console.log(chalk.yellow('No skills installed'));
        return;
      }
      console.log(chalk.bold(`\nInstalled Skills (${skills.length}):\n`));
      for (const skill of skills) {
        console.log(chalk.cyan(`• ${skill.name}`) + ` — ${skill.description.slice(0, 60)}...`);
      }
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

skillsCmd
  .command('load <path>')
  .description('Load a skill from a directory')
  .action(async (skillPath) => {
    try {
      const aione = await getSDK();
      const skill = await aione.loadSkill(skillPath);
      console.log(chalk.green(`✓`) + ` Loaded skill: ${skill.name}`);
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

skillsCmd
  .command('run <name> [workflow]')
  .description('Execute a skill')
  .action(async (name, workflow) => {
    try {
      const aione = await getSDK();
      const result = await aione.executeSkill(name, workflow);
      if (result.success) {
        console.log(chalk.green(`✓`) + ` Skill executed in ${result.durationMs}ms`);
        if (result.output) {
          console.log('\n' + result.output);
        }
      } else {
        console.error(chalk.red(`✗ Skill failed:`), result.error);
        process.exit(1);
      }
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

// --- Algorithm Commands ---

const algoCmd = program.command('algorithm').description('Algorithm (Ideal State Assessment) commands');

algoCmd
  .command('run <task>')
  .description('Run the Algorithm on a task')
  .action(async (task) => {
    try {
      const aione = await getSDK();
      console.log(chalk.cyan('⏳ Running Algorithm...'));
      const result = await aione.assess(task);

      console.log(chalk.bold('\n🔬 Algorithm Results\n'));
      console.log(chalk.bold('Quality Score:') + ` ${result.quality}/100`);
      console.log(chalk.bold('\nTransitions:'));
      for (const t of result.transitions) {
        console.log(`  ${chalk.cyan(`[Phase ${t.phase}]`)} ${chalk.bold(t.name)}`);
        console.log(`    → ${t.action}`);
      }
      console.log(chalk.bold('\nGap Analysis:'));
      for (const g of result.gap) {
        console.log(`  • ${g}`);
      }
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

// --- Run Command ---

program
  .command('run [input...]')
  .description('Run the agent with a prompt')
  .action(async (inputs) => {
    try {
      const aione = await getSDK();
      const input = inputs.join(' ');
      console.log(chalk.cyan('⏳ Thinking...'));
      const response = await aione.run(input);
      console.log(chalk.bold('\n💬 Response:\n'));
      console.log(response.content);
      if (response.metrics) {
        console.log(chalk.gray(`\n[${response.metrics.durationMs}ms | ${response.metrics.tokensUsed || 0} tokens]`));
      }
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

// --- Info Command ---

program
  .command('info')
  .description('Show AIONE system information')
  .action(async () => {
    try {
      const aione = await getSDK();
      const da = aione.getDA();
      const isc = aione.getISC();
      const memoryStats = await aione.memoryStats();
      const skills = await aione.listSkills();

      console.log(chalk.bold('\n🤖 AIONE System Info\n'));
      console.log(chalk.bold('Version:') + ` ${aione.version()}`);
      console.log(chalk.bold('DA Identity:') + ` ${da.name}`);
      console.log(chalk.bold('Skills:') + ` ${skills.length} installed`);
      console.log(chalk.bold('Memory:') + ` ${memoryStats.total} entries`);
      console.log(chalk.bold('\nCurrent ISC:'));
      console.log(`  Problem: ${isc.problem?.slice(0, 50) || 'Not set'}...`);
      console.log(`  Goal: ${isc.goal?.slice(0, 50) || 'Not set'}...`);
    } catch (e) {
      console.error(chalk.red(`✗`), e);
      process.exit(1);
    }
  });

// Parse and execute
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}