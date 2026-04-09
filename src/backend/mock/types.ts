export type MockCommandArgs = Record<string, unknown> | undefined;

export type MockCommandHandler = <T>(args?: MockCommandArgs) => Promise<T> | T;
