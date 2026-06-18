declare const require: {
  (path: string): number;
  context(
    path: string,
    useSubdirectories?: boolean,
    regExp?: RegExp
  ): {
    (id: string): number;
    keys(): string[];
  };
};
