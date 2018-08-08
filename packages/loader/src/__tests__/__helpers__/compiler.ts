import * as path from 'path';
import * as webpack from 'webpack';
import * as MemoryFileSystem from 'memory-fs';

export default (fixture, options = {}): Promise<webpack.Stats> => {
  const compiler: webpack.Compiler = webpack({
    context: __dirname,
    entry: `../${fixture}`,
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    module: {
      rules: [{
        test: /\.graphql$/,
        use: [
          {
            loader: path.resolve(__dirname, 'fakeLoader.ts')
          },
          {
            loader: path.resolve(__dirname, '../../index.ts'),
            options
          }
        ]
      }]
    }
  });

  compiler.outputFileSystem = new MemoryFileSystem() as any;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error(`Webpack Error: ${stats.toJson().errors.join(', ')}`));
      }
      resolve(stats);
    });
  });
};
