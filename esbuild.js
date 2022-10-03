import * as Esbuild from "esbuild";

const shouldServe = process.argv.includes("--serve");

/**
 * @type Esbuild.BuildOptions
 */
const buildOptions = {
  entryPoints: {
    main: "build/index.js",
    assets: "assets/energy.json",
  },
  bundle: true,
  outdir: "bundle",
  format: "esm",
  target: "es2020",
  splitting: true,
  sourcemap: true,
};

if (shouldServe) {
  Esbuild.serve(
    {
      port: 3000,
      servedir: "www",
    },
    { ...buildOptions, outdir: "www/bundle" }
  ).then((result) => {
    console.log(`up and running on ${result.host}:${result.port}`);
  });
} else {
  Esbuild.build(buildOptions);
}
