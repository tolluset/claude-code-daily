import chalk from 'chalk';
import { getTodayStats, checkServerHealth } from '../api';

export async function reportCommand(): Promise<void> {
  // Check server status
  const isServerUp = await checkServerHealth();
  if (!isServerUp) {
    console.log(chalk.yellow('CCD server is not running.'));
    console.log(chalk.gray('The server will start automatically when you start a Claude Code session.'));
    return;
  }

  const data = await getTodayStats();
  if (!data) {
    console.log(chalk.red('Failed to fetch statistics.'));
    return;
  }

  const { stats, sessions } = data;
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  console.log();
  console.log(chalk.bold.cyan('📊 Claude Code Daily Report'));
  console.log(chalk.gray(`   ${today}`));
  console.log();

  // Display statistics
  console.log(chalk.bold('Today\'s Statistics'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  Sessions       ${chalk.bold.white(stats.session_count)}`);
  console.log(`  Messages       ${chalk.bold.white(stats.message_count)}`);
  console.log(`  Input Tokens   ${chalk.bold.green(formatNumber(stats.total_input_tokens))}`);
  console.log(`  Output Tokens  ${chalk.bold.blue(formatNumber(stats.total_output_tokens))}`);
  console.log(`  Total Tokens   ${chalk.bold.yellow(formatNumber(stats.total_input_tokens + stats.total_output_tokens))}`);
  console.log();

  // Insights
  if (stats.session_count > 0) {
    console.log(chalk.bold('Insights'));
    console.log(chalk.gray('─'.repeat(40)));

    const avgMessagesPerSession = Math.round(stats.message_count / stats.session_count);
    const avgTokensPerMessage = stats.message_count > 0
      ? Math.round((stats.total_input_tokens + stats.total_output_tokens) / stats.message_count)
      : 0;

    console.log(`  Avg Messages/Session   ${chalk.white(avgMessagesPerSession)}`);
    console.log(`  Avg Tokens/Message     ${chalk.white(formatNumber(avgTokensPerMessage))}`);

    // Bookmarked session count
    const bookmarkedCount = sessions.filter(s => s.is_bookmarked).length;
    if (bookmarkedCount > 0) {
      console.log(`  Bookmarked Sessions    ${chalk.yellow(bookmarkedCount)}`);
    }
    console.log();
  }

  // Sessions by project
  if (sessions.length > 0) {
    console.log(chalk.bold('Sessions by Project'));
    console.log(chalk.gray('─'.repeat(40)));

    const projectCounts = new Map<string, number>();
    for (const session of sessions) {
      const project = session.project_name || '(unknown)';
      projectCounts.set(project, (projectCounts.get(project) || 0) + 1);
    }

    const sorted = [...projectCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [project, count] of sorted.slice(0, 5)) {
      console.log(`  ${chalk.white(project.padEnd(25))} ${chalk.gray(count)}`);
    }
    console.log();
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
