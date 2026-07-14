const python = process.platform === "win32" ? ".venv/bin/python.exe" : ".venv/bin/python";

const services = [
  {
    name: "news",
    process: Bun.spawn([python, "backend/server.py"], {
      cwd: process.cwd(),
      stdout: "inherit",
      stderr: "inherit",
    }),
  },
  {
    name: "web",
    process: Bun.spawn(["bun", "run", "dev:web"], {
      cwd: process.cwd(),
      stdout: "inherit",
      stderr: "inherit",
    }),
  },
];

let stopping = false;

function stopServices() {
  if (stopping) return;
  stopping = true;
  for (const service of services) {
    service.process.kill();
  }
}

process.on("SIGINT", stopServices);
process.on("SIGTERM", stopServices);

const finished = services.map(async (service) => ({
  name: service.name,
  exitCode: await service.process.exited,
}));

const first = await Promise.race(finished);
const stoppedByUser = stopping;
stopServices();

if (!stoppedByUser && first.exitCode !== 0) {
  console.error(`${first.name} service stopped with exit code ${first.exitCode}`);
  process.exit(first.exitCode);
}
