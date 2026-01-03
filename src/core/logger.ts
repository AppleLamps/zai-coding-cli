import chalk from "chalk";

export class Logger {
  info(message: string) {
    console.log(chalk.cyan(message));
  }

  warn(message: string) {
    console.warn(chalk.yellow(message));
  }

  error(message: string) {
    console.error(chalk.red(message));
  }
}
