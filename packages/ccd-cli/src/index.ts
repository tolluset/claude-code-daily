#!/usr/bin/env bun
import { Command } from 'commander';
import { reportCommand } from './commands/report';
import { listCommand } from './commands/list';
import { openDashboard } from './commands/dashboard';

const program = new Command();

program
  .name('ccd')
  .description('Claude Code Daily - Session tracking and analytics CLI')
  .version('0.1.0');

// ccd report - Today's statistics
program
  .command('report')
  .description('Display daily statistics and insights')
  .action(reportCommand);

// ccd list - Today's session list
program
  .command('list')
  .description('Display today\'s session list')
  .action(listCommand);

// ccd (default) - Open dashboard
program
  .action(async () => {
    await openDashboard();
  });

program.parse();
