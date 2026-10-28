if (typeof process !== "undefined" && typeof (process as any).getBuiltinModule === "function") {
  const orig = (process as any).getBuiltinModule.bind(process);
  (process as any).getBuiltinModule = (id: string) => {
    const m = orig(id);
    if (id === "v8" && m) {
      m.startupSnapshot = { isBuildingSnapshot: () => false };
    }
    return m;
  };
}
