// solution adapted from https://medium.com/@blogs4devs/implementing-a-remote-code-execution-engine-from-scratch-4a765a3c7303

import {exec} from 'child_process';

class Semaphore {
  private max: number;
  private count: number;
  private queue: Array<() => void>;

  constructor(max: number) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  async acquire(): Promise<void> {
    if (this.count < this.max) {
      this.count++;
      return Promise.resolve();
    }

    return new Promise(resolve => this.queue.push(resolve));
  }

  release(): void {
    this.count--;
    if (this.queue.length > 0) {
      this.count++;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}

const userCreationSemaphore = new Semaphore(1);

export const execShellCommand = async (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${cmd}`); // Log the command
    exec(cmd, {timeout: 100000}, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error('Error: ', stderr || error?.message);
        reject(stderr || error?.message || 'Unknown error');
      } else {
        console.log(`Command output: ${stdout}`); // Log the output
        resolve(stdout);
      }
    });
  });
};

const createUser = async (
  username: string,
  _cpuLimit = '10000',
  _memoryLimit = '500M'
): Promise<void> => {
  await userCreationSemaphore.acquire();
  try {
    const createUserCommand = `sudo useradd -m ${username} && echo '${username}:p' | sudo chpasswd`;
    await execShellCommand(createUserCommand);
    console.log(`User ${username} created successfully.`);
  } catch (error) {
    console.error(`Error creating user ${username}:`, error);
    throw error;
  } finally {
    userCreationSemaphore.release();
  }
};

const deleteUser = async (username: string): Promise<void> => {
  await userCreationSemaphore.acquire();
  try {
    const deleteUserCommand = `sudo userdel -r ${username}`;
    await execShellCommand(deleteUserCommand);
    console.log(`User ${username} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting user ${username}:`, error);
    throw error;
  } finally {
    userCreationSemaphore.release();
  }
};

const killProcessGroup = async (pgid: number): Promise<void> => {
  const killCommand = `sudo kill -TERM -${pgid}`; // Send SIGTERM to process group
  await execShellCommand(killCommand);
};

export {createUser, deleteUser, killProcessGroup};
