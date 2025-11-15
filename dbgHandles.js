const logHandles = () => {
  const handles = process._getActiveHandles().map((handle) => handle.constructor?.name ?? 'unknown');
  console.log('DBG handles', handles.join(', '));
};
setTimeout(logHandles, 5000);
setTimeout(logHandles, 10000);
setTimeout(logHandles, 15000);
