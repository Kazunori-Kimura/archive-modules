"use strict";
const fs = require("fs-extra-promise");
const path = require("path");
const co = require("co");
const glob = require("glob-promise");
const archiver = require("archiver");

co(function* (){
  const src = process.argv[2];
  const dist = process.argv[3];
  console.log(`${src} => ${dist}`);
  
  // サブディレクトリを取得
  const dirs = yield glob("*", { cwd: src });
  
  // 各ディレクトリを圧縮
  for (let i=0; i<dirs.length; i++) {
    const dirPath = path.resolve(src, dirs[i]);
    const zipPath = `${path.resolve(dist, dirs[i])}.zip`;
    
    const ret = yield zip(dirPath, zipPath);
    console.log(`archived: ${ret.name} (${ret.size} bytes)`);
  }
  
}).catch((err) => {
  console.error(err);
});

/**
 * srcを圧縮してdistにファイル出力
 * @param {string} src - 圧縮するディレクトリ
 * @param {string} dist - 出力ファイル名
 * @return {object} Promise
 */
function zip(src, dist) {
  return new Promise((resolve) => {
    // zipファイルのストリームを生成して、archiverと紐付ける
    const archive = archiver.create("zip", {});
    const output = fs.createWriteStream(dist);
    archive.pipe(output);
    
    //const parent = path.dirname(dist);
    // bulkメソッドで、対象となるファイルディレクトリを指定する
    archive.bulk([
      {
        expand: true,
        cwd: src,
        src: ["**/*"],
        //dest: parent,
        dot: true
      }
    ]);
     
    // archive.finalize()で、zip圧縮完了すると、
    // ストリームのクローズイベントが発火する
    output.on("close", function(){
      // zipファイル作成完了
      resolve({ name: dist, size: archive.pointer() });
    });
 
    // zip圧縮実行
    archive.finalize();
  });
}
