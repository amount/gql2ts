import * as path from 'path';
import * as webpack from 'webpack';
import * as MemoryFileSystem from 'memory-fs';

export default (fixture, options = {}) => {
  const compiler: webpack.Compiler = webpack({
    context: __dirname,
    entry: `./${fixture}`,
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    module: {
      rules: [{
        test: /\.graphql$/,
        use: {
          loader: path.resolve(__dirname, '../src/index.ts'),
          options
        }
      }]
    }
  });

  compiler.outputFileSystem = new MemoryFileSystem() as any;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        reject(err);
      }

      resolve(stats);
    });
  });
};
