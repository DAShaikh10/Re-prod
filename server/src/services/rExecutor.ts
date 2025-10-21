import { spawn } from 'child_process';
import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ExecutionResult, PlotInfo } from '../../../shared/src/types';

export class RExecutor {
  private tempDir: string;
  private plotCounter: number = 0;
  private rPath: string;

  constructor() {
    this.tempDir = join(process.cwd(), 'temp');
    this.rPath = process.env.R_PATH || 'Rscript';
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    if (!existsSync(this.tempDir)) {
      await mkdir(this.tempDir, { recursive: true });
    }
  }

  async execute(code: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timestamp = Date.now();
    const scriptPath = join(this.tempDir, `script_${timestamp}.R`);

    this.plotCounter++;
    const plotPrefix = `plot_${this.plotCounter}_${timestamp}`;

    try {
      await this.ensureTempDir();

      // Wrap code to capture plots
      const wrappedCode = this.wrapCodeWithPlotCapture(code, plotPrefix);

      // Write R script
      await writeFile(scriptPath, wrappedCode, 'utf-8');

      // Execute R script
      const { stdout, stderr, exitCode } = await this.runRScript(scriptPath);

      // Collect generated plots
      const plots = await this.collectPlots(plotPrefix);

      const duration = Date.now() - startTime;

      return {
        stdout,
        stderr,
        plots,
        timestamp,
        duration,
        success: exitCode === 0
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        plots: [],
        timestamp,
        duration,
        success: false
      };
    } finally {
      // Cleanup script file
      try {
        if (existsSync(scriptPath)) {
          await unlink(scriptPath);
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup script:', cleanupError);
      }
    }
  }

  private wrapCodeWithPlotCapture(code: string, plotPrefix: string): string {
    const tempDirEscaped = this.tempDir.replace(/\\/g, '/');

    return `
# Re-Prod plot capture setup
.reprod_plot_counter <- 0
.reprod_temp_dir <- "${tempDirEscaped}"
.reprod_plot_prefix <- "${plotPrefix}"

# Override graphics device for automatic plot capture
.reprod_new_plot <- function() {
  .reprod_plot_counter <<- .reprod_plot_counter + 1
  plot_file <- file.path(.reprod_temp_dir, paste0(.reprod_plot_prefix, "_", .reprod_plot_counter, ".png"))
  png(plot_file, width = 800, height = 600, bg = "white")
}

# Set default device
options(device = .reprod_new_plot)

# User code starts here
${code}

# Close any open devices
while (dev.cur() > 1) dev.off()
`;
  }

  private runRScript(scriptPath: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const rProcess = spawn(this.rPath, ['--vanilla', '--quiet', scriptPath], {
        env: { ...process.env, R_HOME: undefined }
      });

      let stdout = '';
      let stderr = '';

      rProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      rProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rProcess.on('close', (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0
        });
      });

      rProcess.on('error', (error) => {
        resolve({
          stdout: '',
          stderr: `Failed to start R process: ${error.message}`,
          exitCode: 1
        });
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        rProcess.kill();
        resolve({
          stdout,
          stderr: stderr + '\nExecution timeout (30s)',
          exitCode: 1
        });
      }, 30000);
    });
  }

  private async collectPlots(plotPrefix: string): Promise<PlotInfo[]> {
    const { readdir } = await import('fs/promises');

    try {
      const files = await readdir(this.tempDir);
      const plotFiles = files
        .filter(f => f.startsWith(plotPrefix) && f.endsWith('.png'))
        .sort();

      const plots: PlotInfo[] = [];

      for (const file of plotFiles) {
        const filepath = join(this.tempDir, file);
        try {
          const imageData = await readFile(filepath);
          const base64Data = imageData.toString('base64');

          plots.push({
            id: file,
            path: filepath,
            data: `data:image/png;base64,${base64Data}`,
            timestamp: Date.now()
          });
        } catch (readError) {
          console.error(`Failed to read plot ${file}:`, readError);
        }
      }

      return plots;
    } catch (error) {
      console.error('Failed to collect plots:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    // Clean up old temporary files
    try {
      const { readdir, unlink, stat } = await import('fs/promises');
      const files = await readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 3600000; // 1 hour

      for (const file of files) {
        const filepath = join(this.tempDir, file);
        const stats = await stat(filepath);

        if (now - stats.mtimeMs > maxAge) {
          await unlink(filepath);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}
