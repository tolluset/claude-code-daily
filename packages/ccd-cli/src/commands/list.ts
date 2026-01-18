import chalk from 'chalk';
import { getTodaySessions, checkServerHealth } from '../api';
import type { Session } from '@ccd/types';

export async function listCommand(): Promise<void> {
  // Check server status
  const isServerUp = await checkServerHealth();
  if (!isServerUp) {
    console.log(chalk.yellow('CCD server is not running.'));
    console.log(chalk.gray('The server will start automatically when you start a Claude Code session.'));
    return;
  }

  const data = await getTodaySessions();
  if (!data) {
    console.log(chalk.red('Failed to fetch session list.'));
    return;
  }

  const { sessions } = data;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  console.log();
  console.log(chalk.bold.cyan('📋 Today\'s Sessions'));
  console.log(chalk.gray(`   ${today} · ${sessions.length} sessions`));
  console.log();

  if (sessions.length === 0) {
    console.log(chalk.gray('  No sessions today.'));
    console.log();
    return;
  }

  // Separate bookmarked and regular sessions
  const bookmarked = sessions.filter(s => s.is_bookmarked);
  const regular = sessions.filter(s => !s.is_bookmarked);

  if (bookmarked.length > 0) {
    console.log(chalk.bold.yellow('⭐ Bookmarks'));
    console.log(chalk.gray('─'.repeat(50)));
    for (const session of bookmarked) {
      printSession(session);
    }
    console.log();
  }

  if (regular.length > 0) {
    if (bookmarked.length > 0) {
      console.log(chalk.bold('Sessions'));
      console.log(chalk.gray('─'.repeat(50)));
    }
    for (const session of regular) {
      printSession(session);
    }
    console.log();
  }

  // Resume hint
  console.log(chalk.gray('Use claude --resume <session_id> to resume a session.'));
  console.log();
}

function printSession(session: Session): void {
  const time = new Date(session.started_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const projectName = session.project_name || '(unknown)';
  const branch = session.git_branch ? chalk.gray(`(${session.git_branch})`) : '';
  const bookmark = session.is_bookmarked ? chalk.yellow('⭐ ') : '   ';
  const note = session.bookmark_note ? chalk.gray(` - ${session.bookmark_note}`) : '';

  // Session status
  const isActive = !session.ended_at;
  const status = isActive ? chalk.green('●') : chalk.gray('○');

  console.log(`${bookmark}${status} ${chalk.gray(time)} ${chalk.white(projectName)} ${branch}${note}`);
  console.log(`      ${chalk.gray('ID:')} ${chalk.dim(session.id.slice(0, 8))}`);
}
