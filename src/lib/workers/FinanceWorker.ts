// Web Worker for heavy financial analysis so the UI thread remains smooth.
// Usage (in main thread):
//   const worker = new FinanceWorker();
//   worker.postMessage({ type: 'analyze-finances', data: finances });
//   worker.onmessage = e => { if (e.data.type === 'analysis-result') console.log(e.data.result); };

// Ensure correct typings inside the worker context
export {}; // marks this file as a module

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: `self` in workers is DedicatedWorkerGlobalScope
const ctx: DedicatedWorkerGlobalScope = self as any;

interface WorkerMessage {
  type: 'analyze-finances';
  data: unknown;
}

interface WorkerResponse {
  type: 'analysis-result';
  result: unknown;
}

ctx.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;

  if (type === 'analyze-finances') {
    const result = complexFinancialAnalysis(data);
    ctx.postMessage({ type: 'analysis-result', result } as WorkerResponse);
  }
};

/**
 * Perform potentially CPU-intensive calculations on the given financial dataset.
 * Replace the stub with your real analysis algorithm.
 */
function complexFinancialAnalysis(data: unknown): unknown {
  // TODO: implement real analysis logic. Right now, just echoing data.
  return {
    echoed: data,
    generatedAt: Date.now(),
  };
}
